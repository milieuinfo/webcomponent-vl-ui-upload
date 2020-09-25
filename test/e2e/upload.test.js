const {assert, driver} = require('vl-ui-core').Test.Setup;
const {Config} = require('vl-ui-core').Test;
const VlUploadPage = require('./pages/vl-upload.page');
const path = require('path');
const Express = require('express');
const Multer = require('multer');
const remote = require('selenium-webdriver/remote');

describe('vl-upload', async () => {
  const vlUploadPage = new VlUploadPage(driver);
  let fileUploadServer;
  const uploadServerPort = 8888;
  const uploadServerPath = '/post';

  before(async () => {
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
    fileUploadServer.stop();
  });

  function file(name) {
    return path.resolve(__dirname, `./${name}`);
  }

  it('Als gebruiker kan ik een bestand selecteren om op te laden, maar het nog niet onmiddellijk opladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file('bestand.pdf'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await assert.eventually.equal(files[0].getName(), 'bestand.pdf');
    await assert.eventually.equal(files[0].getSize(), '13.1 KB');
    assert.equal(fileUploadServer.uploadedFiles.length, 0);
    assert.eventually.isFalse(files[0].isProcessing());
    assert.eventually.isFalse(files[0].isSuccess());
    assert.eventually.isFalse(files[0].isError());
  });

  it('Als gebruiker kan ik verschillende bestanden selecteren om op te laden en ze dan programmatorisch opladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file('bestand.pdf'));
    await vlUploadPage.uploadFiles();
    await driver.wait(async () => {
      return fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == 'bestand.pdf';
    });
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    assert.eventually.isTrue(files[0].isProcessing());
    assert.eventually.isTrue(files[0].isSuccess());
    assert.eventually.isFalse(files[0].isError());
  });

  it('Als gebruiker kan ik een bestand direct laten opladen bij het selecteren', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    await upload.uploadFile(file('bestand.pdf'));
    await driver.wait(async () => {
      const files = await upload.getFiles();
      return files.length == 1 && fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == 'bestand.pdf';
    });
  });

  it('Als gebruiker zie ik het onderscheid tussen een gewone upload en een upload in error state', async () => {
    const upload = await vlUploadPage.getUpload();
    const uploadError = await vlUploadPage.getUploadError();
    await assert.eventually.isFalse(upload.isError());
    await assert.eventually.isTrue(uploadError.isError());
  });

  it('Als gebruiker zie ik een foutboodschap bij een bestand als het opladen mislukt', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    fileUploadServer.failUploads();
    await upload.uploadFile(file('bestand.pdf'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await assert.eventually.equal(files[0].getErrorMessage(), 'Uw bestand kon niet verwerkt worden');
    assert.eventually.isTrue(files[0].isProcessing());
    assert.eventually.isFalse(files[0].isSuccess());
    assert.eventually.isTrue(files[0].isError());
  });

  it('Als gebruiker kan ik de lijst gekozen files programmatorisch leeg maken', async () => {
    const upload = await vlUploadPage.getUploadClear();
    await upload.uploadFile(file('bestand.pdf'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const clearButton = await vlUploadPage.uploadClearButton();
    await clearButton.click();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('Als gebruiker kan ik de maximum bestandsgrootte bepalen', async () => {
    const upload = await vlUploadPage.getUploadMaxSize();
    await assert.eventually.equal(upload.getMaximumFilesize(), 2000000);
    await upload.uploadFile(file('largefile.bin'));
    const filesTooBig = await upload.getFiles();
    await assert.eventually.equal(filesTooBig[0].getErrorMessage(), 'De grootte van het bestand mag maximaal 2 MB zijn.');
  });

  it('Als gebruiker kan ik er voor zorgen dat hetzelfde bestand geen 2 keer kan opgeladen worden', async () => {
    const upload = await vlUploadPage.getUploadUnique();
    await assert.eventually.isTrue(upload.isDuplicatesDisallowed());
    await upload.uploadFile(file('textfile1.txt'));
    await upload.uploadFile(file('textfile1.txt'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    await upload.uploadFile(file('textfile2.txt'));
    await assert.eventually.lengthOf(upload.getFiles(), 2);
  });

  it('Als gebruiker kan ik enkel bepaalde filetypes toelaten om opgeladen te worden', async () => {
    const upload = await vlUploadPage.getUploadFileTypes();
    await assert.eventually.equal(upload.getAcceptedFileTypes(), 'application/pdf, .png');
    await upload.uploadFile(file('textfile1.txt'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    // TODO de foutboodschap die hier uit komt is fout (fileType niet vervangen)
    // dit is een openstaande bug die mogelijks opgelost is/wordt in de volgende versie van webuniversum
    await assert.eventually.equal(files[0].getErrorMessage(), 'Je kan enkel :fileType bestanden opladen');
  });

  it('Als gebruiker kan ik het verschil zien tussen een upload over de gehele body of niet', async () => {
    const upload = await vlUploadPage.getUpload();
    const uploadFullBodyDrop = await vlUploadPage.getUploadFullBodyDrop();
    await assert.eventually.isFalse(upload.isFullBodyDrop());
    await assert.eventually.isTrue(uploadFullBodyDrop.isFullBodyDrop());
  });

  it('Als gebruiker kan ik events ontvangen wanneer er bestanden worden opgeladen', async () => {
    const upload = await vlUploadPage.getUpload();
    await vlUploadPage.listenForEventsOnUpload();
    await upload.uploadFile(file('textfile1.txt'));
    await assert.eventually.equal(vlUploadPage.getVlUploadLogText(), 'Bestanden in vl-upload: textfile1.txt');
  });

  it('Als gebruiker kan ik een gekozen bestand verwijderen', async () => {
    const upload = await vlUploadPage.getUpload();
    await upload.uploadFile(file('bestand.pdf'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await files[0].remove();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('Als gebruiker kan ik het opladen van een bestand ook annuleren tijdens dat het aan het opladen is', async () => {
    const upload = await vlUploadPage.getUploadAutoProcess();
    fileUploadServer.haltUploads();
    await upload.uploadFile(file('bestand.pdf'));
    await assert.eventually.lengthOf(upload.getFiles(), 1);
    const files = await upload.getFiles();
    await files[0].remove();
    await assert.eventually.lengthOf(upload.getFiles(), 0);
  });

  it('Als gebruiker kan ik het aantal files dat mag gekozen worden beperken', async () => {
    const upload = await vlUploadPage.getUploadMax5();
    await assert.eventually.equal(upload.getMaximumNumberOfAllowedFiles(), 5);
    for (let i = 1; i <= 6; i++) {
      await upload.uploadFile(file(`textfile${i}.txt`));
    }
    const files = await upload.getFiles();
    for (let i = 1; i <= 5; i++) {
      await assert.eventually.equal(files[i - 1].getErrorMessage(), '');
    }
    await assert.eventually.equal(files[5].getErrorMessage(), 'Je kan maximaal 5 file(s) uploaden.');
  });

  class FileUploadServer {
    constructor(port, path) {
      this.__uploadedFiles = [];
      this.__failUploads = false;
      this.__haltUploads = false;
      const upload = new Multer({storage: Multer.memoryStorage()});
      this.express = new Express();
      this.express.use(function(request, response, next) {
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

    start(startedCallback) {
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
