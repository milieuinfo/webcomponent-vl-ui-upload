const {assert, getDriver} = require('vl-ui-core').Test.Setup;
const {Config} = require('vl-ui-core').Test;
const VlUploadPage = require('./pages/vl-upload.page');
const path = require('path');
const Express = require('express');
const Multer = require('multer');
const remote = require('selenium-webdriver/remote');
const fs = require("fs");

describe('vl-upload', async () => {
  let driver;
  let vlUploadPage;
  let fileUploadServer;
  const uploadServerPort = 8888;
  const uploadServerPath = '/post';
  const PDF_FILE = 'file.pdf';
  const TXT_FILE = 'file.txt';
  const LARGE_FILE = 'file.bin';

  before(async () => {
    driver = getDriver();
    vlUploadPage = new VlUploadPage(driver);
    const host = Config.baseUrl.match(/http:\/\/(.*):(.*)/)[1];
    await vlUploadPage.load();
    await vlUploadPage.changeAllUploadUrlsTo(`http://${host}:${uploadServerPort}${uploadServerPath}`);
    fileUploadServer = new FileUploadServer(uploadServerPort, uploadServerPath);
    await fileUploadServer.start();
    driver.setFileDetector(new remote.FileDetector);
  });

  beforeEach(async () => {
    fileUploadServer.reset();
    await vlUploadPage.clearAllUploads();
  });

  after(() => {
    return fileUploadServer.stop();
  });

  const file = (name) => {
    if (Config.browserstack) {
      switch (name) {
        case PDF_FILE:
          return 'C:\\Users\\hello\\Documents\\documents\\pdf-sample1.pdf';
        case TXT_FILE:
          return 'C:\\Users\\hello\\Documents\\documents\\text-sample1.txt';
        case LARGE_FILE:
          return 'C:\\Users\\hello\\Documents\\1MBzipFile.zip';
        default:
          break;
      }
    } else {
      return path.resolve(__dirname, `./${name}`);
    }
  };

  it('als gebruiker kan ik een bestand selecteren om op te laden, maar het nog niet onmiddellijk opladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file(PDF_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    assert.equal(fileUploadServer.uploadedFiles.length, 0);
    await assert.eventually.isFalse(files[0].isProcessing());
    await assert.eventually.isFalse(files[0].isSuccess());
    await assert.eventually.isFalse(files[0].isError());
  });

  it('als gebruiker kan ik verschillende bestanden selecteren om op te laden en ze dan programmatorisch opladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file(PDF_FILE));
    await vlUploadPage.uploadFiles();
    await driver.wait(async () => fileUploadServer.uploadedFiles.length == 1);
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await assert.eventually.isTrue(files[0].isProcessing());
    await assert.eventually.isTrue(files[0].isSuccess());
    await assert.eventually.isFalse(files[0].isError());
  });

  it('als gebruiker kan ik een bestand direct laten opladen bij het selecteren', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    await upload.uploadFile(file(PDF_FILE));
    await driver.wait(async () => {
      const files = await upload.getFiles();
      return files.length == 1 && fileUploadServer.uploadedFiles.length == 1;
    });
  });

  it('als gebruiker zie ik het onderscheid tussen een gewone upload en een upload in error state', async () => {
    const upload = await vlUploadPage.getUpload();
    const uploadError = await vlUploadPage.getUploadError();
    await assert.eventually.isFalse(upload.isError());
    await assert.eventually.isTrue(uploadError.isError());
  });

  it('als gebruiker zie ik het onderscheid tussen een gewone upload en een upload in succes state', async () => {
    const upload = await vlUploadPage.getUpload();
    const uploadSuccess = await vlUploadPage.getUploadSuccess();
    await assert.eventually.isFalse(upload.isSuccess());
    await assert.eventually.isTrue(uploadSuccess.isSuccess());
  });

  it('als gebruiker zie ik een foutboodschap bij een bestand als het opladen mislukt', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    fileUploadServer.failUploads();
    await upload.uploadFile(file(PDF_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    let files;
    await driver.wait(async () => {
      files = await upload.getFiles();
      return (await files[0].getErrorMessage() == 'Uw bestand kon niet verwerkt worden');
    });
    await assert.eventually.isTrue(files[0].isProcessing());
    await assert.eventually.isFalse(files[0].isSuccess());
    await assert.eventually.isTrue(files[0].isError());
  });

  it('als gebruiker kan ik de lijst gekozen files programmatorisch leeg maken', async () => {
    const upload = await vlUploadPage.getUploadClear();
    await upload.uploadFile(file(PDF_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const clearButton = await vlUploadPage.uploadClearButton();
    await clearButton.click();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('als gebruiker kan ik de maximum bestandsgrootte bepalen', async () => {
    const upload = await vlUploadPage.getUploadMaxSize();
    await assert.eventually.equal(upload.getMaximumFilesize(), 204800);
    const largeFile = file(LARGE_FILE);
    await upload.uploadFile(largeFile);
    const filesTooBig = await upload.getFiles();
    await assert.eventually.equal(filesTooBig[0].getErrorMessage(), 'De grootte van het bestand mag maximaal 200 KB zijn.');
  });

  it('als gebruiker kan ik er voor zorgen dat hetzelfde bestand geen 2 keer kan opgeladen worden', async () => {
    const upload = await vlUploadPage.getUploadUnique();
    await assert.eventually.isTrue(upload.isDuplicatesDisallowed());
    await upload.uploadFile(file(TXT_FILE));
    await upload.uploadFile(file(TXT_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    await upload.uploadFile(file(PDF_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 2);
  });

  it('als gebruiker kan ik enkel bepaalde filetypes toelaten om opgeladen te worden', async () => {
    const upload = await vlUploadPage.getUploadFileTypes();
    await assert.eventually.equal(upload.getAcceptedFileTypes(), 'application/pdf, .png');
    await upload.uploadFile(file(TXT_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await assert.eventually.equal(files[0].getErrorMessage(), 'Je kan enkel application/pdf, .png bestanden opladen');
  });

  it('als gebruiker kan ik het verschil zien tussen een upload over de gehele body of niet', async () => {
    const upload = await vlUploadPage.getUpload();
    const uploadFullBodyDrop = await vlUploadPage.getUploadFullBodyDrop();
    await assert.eventually.isFalse(upload.isFullBodyDrop());
    await assert.eventually.isTrue(uploadFullBodyDrop.isFullBodyDrop());
  });

  it('als gebruiker kan ik events ontvangen wanneer er bestanden worden opgeladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await vlUploadPage.listenForEventsOnUpload();
    await upload.uploadFile(file(TXT_FILE));
    await assert.eventually.include(vlUploadPage.getVlUploadLogText(), 'Bestanden in vl-upload: ');
  });

  it('als gebruiker kan ik een gekozen bestand verwijderen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file(PDF_FILE));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await files[0].remove();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('als gebruiker kan ik het opladen van een bestand ook annuleren tijdens dat het aan het opladen is', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    fileUploadServer.haltUploads();
    await upload.uploadFile(file(PDF_FILE));
    await driver.wait(async () => (await upload.getFiles()).length == 1);
    const files = await upload.getFiles();
    await files[0].remove();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('als gebruiker kan ik het aantal files dat mag gekozen worden beperken', async () => {
    const upload = await vlUploadPage.getUploadMax5();
    await assert.eventually.equal(upload.getMaximumNumberOfAllowedFiles(), 5);
    for (let i = 1; i <= 6; i++) {
      await upload.uploadFile(file(TXT_FILE));
    }
    const files = await upload.getFiles();
    for (let i = 1; i <= 5; i++) {
      await assert.eventually.equal(files[i - 1].getErrorMessage(), '');
    }
    await assert.eventually.equal(files[5].getErrorMessage(), 'Je kan maximaal 5 file(s) uploaden.');
  });

  it('als gebruiker kan ik een bestand programmatisch toevoegen aan de lijst van opgeladen bestanden', async () => {
    const upload = await vlUploadPage.getUploadProgrammatically();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
    await vlUploadPage.addFileProgrammatically();
    const files = await upload.getFiles();
    await assert.lengthOf(files, 1);
  });

  it('als gebruiker kan ik het verschil zien tussen een upload met gepersonaliseerde titel en subtitel o.b.v. attributen en een gewone variant', async () => {
    let upload = await vlUploadPage.getUpload();
    await assert.eventually.equal(upload.getTitle(), 'Bijlage toevoegen');
    await assert.eventually.equal(upload.getSubTitle(), 'Sleep de bijlage naar hier om toe te voegen');
    upload = await vlUploadPage.getUploadCustomTextViaAttributes();
    await assert.eventually.equal(upload.getTitle(), 'Afbeelding toevoegen');
    await assert.eventually.equal(upload.getSubTitle(), 'Sleep de afbeelding naar hier om toe te voegen');
  });

  it('als gebruiker kan ik het verschil zien tussen een upload met gepersonaliseerde titel en subtitel o.b.v. slots en een gewone variant', async () => {
    let upload = await vlUploadPage.getUpload();
    await assert.eventually.equal(upload.getTitle(), 'Bijlage toevoegen');
    await assert.eventually.equal(upload.getSubTitle(), 'Sleep de bijlage naar hier om toe te voegen');
    upload = await vlUploadPage.getUploadCustomTextViaSlot();
    await assert.eventually.equal(upload.getTitle(), 'Titel');
    await assert.eventually.equal(upload.getSubTitle(), 'Sub-titel');
  });

  it('als gebruiker kan ik geen bestand opladen wanneer het upload element disabled is', async () => {
    const upload = await vlUploadPage.getUploadDisabled();
    await upload.uploadFile(file(PDF_FILE));
    assert.equal(fileUploadServer.uploadedFiles.length, 0);
  });

  class FileUploadServer {
    constructor(port, path) {
      this.__uploadedFiles = [];
      this.__failUploads = false;
      this.__haltUploads = false;
      const upload = new Multer({storage: Multer.memoryStorage()});
      this.express = new Express();
      this.express.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cache-Control');
        next();
      });
      this.express.post(path, upload.array('files'), (request, response) => {
        this.__uploadedFiles = this.__uploadedFiles.concat(request.files.map((file) => file.originalname));
        if (this.__haltUploads) {
          response.status(200);
          response.write('Halting ...');
        } else {
          response.status(this.__failUploads ? 500: 200).send(this.__failUploads ? 'Uw bestand kon niet verwerkt worden': 'OK');
        }
      });
      this.port = port;
    }

    start() {
      return new Promise((resolve) => {
        this.server = this.express.listen(this.port, resolve);
      });
    }

    stop() {
      this.server.close();
    }

    haltUploads() {
      this.__haltUploads = true;
    }

    failUploads() {
      this.__failUploads = true;
    }

    get uploadedFiles() {
      return this.__uploadedFiles;
    }

    reset() {
      this.__failUploads = false;
      this.__haltUploads = false;
      this.__uploadedFiles = [];
    }
  }
});
