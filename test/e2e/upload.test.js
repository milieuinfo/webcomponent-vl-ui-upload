const { assert, driver } = require('vl-ui-core').Test.Setup;
const VlUploadPage = require('./pages/vl-upload.page');
const path = require('path');
const Express = require("express");
const Multer = require("multer");

describe('vl-upload', async () => {
    const vlUploadPage = new VlUploadPage(driver);
    let fileUploadServer;
    const uploadServerPort = 8888;
    const uploadServerPath = "/post";
    
    beforeEach(async () => {
    	fileUploadServer.reset();
    	await vlUploadPage.clearAllUploads();
    });
    
    before((done) => {
    	vlUploadPage.load().then(() => {
    		vlUploadPage.changeAllUploadUrlsTo(`http://localhost:${uploadServerPort}${uploadServerPath}`).then(() => {
    	    	fileUploadServer = new FileUploadServer(uploadServerPort, uploadServerPath);
    	    	fileUploadServer.start(done);
    		});
    	});
    });
    
    after(() => {
    	fileUploadServer.stop();
    });
    
    it("Als gebruiker kan ik een bestand selecteren om op te laden, maar het nog niet onmiddellijk opladen", async () => {
    	const upload = await vlUploadPage.getUpload();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	await upload.uploadFile(file);
    	const files = await upload.getFiles();
    	assert.equal(files.length, 1);
    	await assert.eventually.equal(files[0].getName(), "bestand.pdf");
    	await assert.eventually.equal(files[0].getSize(), "13.1 KB");
    	assert.equal(fileUploadServer.uploadedFiles.length, 0);
    	assert.eventually.isFalse(files[0].isProcessing());
    	assert.eventually.isFalse(files[0].isSuccess());
    	assert.eventually.isFalse(files[0].isError());
    });
   
    it("Als gebruiker kan ik verschillende bestanden selecteren om op te laden en ze dan programmatorisch opladen", async () => {
    	const upload = await vlUploadPage.getUpload();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	await upload.uploadFile(file);
    	await vlUploadPage.uploadFiles();
    	await driver.wait(async () => {
    		return fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == "bestand.pdf";
    	});
    	const files = await upload.getFiles();
    	assert.equal(files.length, 1);
    	assert.eventually.isTrue(files[0].isProcessing());
    	assert.eventually.isTrue(files[0].isSuccess());
    	assert.eventually.isFalse(files[0].isError());
    });
    
    it("Als gebruiker kan ik een  bestand direct laten opladen bij het selecteren", async () => {
    	const upload = await vlUploadPage.getUploadAutoProcess();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	await upload.uploadFile(file);
    	await driver.wait(async () => {
    		const files = await upload.getFiles();
            return files.length == 1 && fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == "bestand.pdf";
        });
    });
    
    it("Als gebruiker zie ik het onderscheid tussen een gewone upload en een upload in error state", async () => {
    	const upload = await vlUploadPage.getUpload();
    	const uploadError = await vlUploadPage.getUploadError();
    	await assert.eventually.isFalse(upload.isError());
    	await assert.eventually.isTrue(uploadError.isError());
    });
    
    it("Als gebruiker zie ik een foutboodschap bij een bestand als het opladen mislukt", async () => {
    	const upload = await vlUploadPage.getUploadAutoProcess();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	fileUploadServer.failUploads();
    	await upload.uploadFile(file);
    	const files = await upload.getFiles();
    	assert.equal(files.length, 1);
    	await assert.eventually.equal(files[0].getErrorMessage(), "Uw bestand kon niet verwerkt worden");
    	assert.eventually.isTrue(files[0].isProcessing());
    	assert.eventually.isFalse(files[0].isSuccess());
    	assert.eventually.isTrue(files[0].isError());
    });

    it("Als gebruiker kan ik de lijst gekozen files programmatorisch leeg maken", async () => {
    	const upload = await vlUploadPage.getUploadClear();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	await upload.uploadFile(file);
    	const filesBefore = await upload.getFiles();
    	assert.equal(filesBefore.length, 1);
    	await vlUploadPage.clearUploadClear();
    	const filesAfter = await upload.getFiles();
    	assert.equal(filesAfter.length, 0);
    });
    
    it("Als gebruiker kan ik het aantal files dat mag gekozen worden beperken", async () => {
    	const upload = await vlUploadPage.getUploadMax5();
    	await assert.eventually.equal(upload.getMaximumNumberOfAllowedFiles(), 5);
    	for (let i = 1; i <= 6; i++) {
    		await upload.uploadFile(path.resolve(__dirname, `./textfile${i}.txt`));
    	}
    	const files = await upload.getFiles();
    	for (let i = 1; i <= 5; i++) {
    		await assert.eventually.equal(files[i - 1].getErrorMessage(), "");
    	}
    	await assert.eventually.equal(files[5].getErrorMessage(), "Je kan maximaal 5 file(s) uploaden.");
    });
    
    it("Als gebruiker kan ik de maximum bestandsgrootte bepalen", async () => {
    	const upload = await vlUploadPage.getUploadMaxSize();
    	await assert.eventually.equal(upload.getMaximumFilesize(), 2000000);
    	await upload.uploadFile(path.resolve(__dirname, './largefile.bin'));
    	const filesTooBig = await upload.getFiles();
    	//TODO de foutboodschap die hier uit komt is fout (2MB ipv 2KB)
    	//dit is een openstaande bug die opgelost is in de volgende versie van webuniversum
    	await assert.eventually.equal(filesTooBig[0].getErrorMessage(), "De grootte van het bestand mag maximaal 2 KB zijn.");
    });
    
    it("Als gebruiker kan ik er voor zorgen dat hetzelfde bestand geen 2 keer kan opgeladen worden", async () => {
    	const upload = await vlUploadPage.getUploadGeenDubbels();
    	await assert.eventually.isTrue(upload.isDuplicatesDisallowed());
    	await upload.uploadFile(path.resolve(__dirname, './textfile1.txt'));
    	await upload.uploadFile(path.resolve(__dirname, './textfile1.txt'));
    	let files = await upload.getFiles();
    	assert.equal(files.length, 1);
    	await upload.uploadFile(path.resolve(__dirname, './textfile2.txt'));
    	files = await upload.getFiles();
    	assert.equal(files.length, 2);
    });

    it("Als gebruiker kan ik enkel bepaalde filetypes toelaten om opgeladen te worden", async () => {
    	const upload = await vlUploadPage.getUploadFileTypes();
    	await assert.eventually.equal(upload.getAcceptedFileTypes(), "application/pdf, .png");
    	await upload.uploadFile(path.resolve(__dirname, './textfile1.txt'));
    	let files = await upload.getFiles();
    	assert.equal(files.length, 1);
    	//TODO de foutboodschap die hier uit komt is fout (fileType niet vervangen)
    	//dit is een openstaande bug die mogelijks opgelost is/wordt in de volgende versie van webuniversum
    	await assert.eventually.equal(files[0].getErrorMessage(), "Je kan enkel :fileType bestanden opladen");
    });
    
    it("Als gebruiker kan ik het verschil zien tussen een upload over de gehele body of niet", async () => {
    	const upload = await vlUploadPage.getUpload();
    	const uploadFullBodyDrop = await vlUploadPage.getUploadFullBodyDrop();
    	await assert.eventually.isFalse(upload.isFullBodyDrop());
    	await assert.eventually.isTrue(uploadFullBodyDrop.isFullBodyDrop());
    });
    
    it("Als gebruiker kan ik events ontvangen wanneer er bestanden worden opgeladen", async () => {
    	const upload = await vlUploadPage.getUpload();
    	await vlUploadPage.listenForEventsOnUpload();
    	await upload.uploadFile(path.resolve(__dirname, './textfile1.txt'));
    	await assert.eventually.equal(vlUploadPage.getVlUploadLogText(), "Bestanden in vl-upload: textfile1.txt");
    });
    
    class FileUploadServer {
    	constructor(port, path) {
    		this.__uploadedFiles = [];
    		this.__failUploads = false;
    		var upload = Multer({ storage: Multer.memoryStorage() });
    		this.express = Express();
    		this.express.use(function(request, response, next) {
    			response.header("Access-Control-Allow-Origin", "*");
    			response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
    			next();
    		});
    		this.express.post(path, upload.array("files"), (request, response) => {
    			this.__uploadedFiles = this.__uploadedFiles.concat(request.files.map(file => file.originalname));
    			response.status(this.__failUploads ? 500: 200).send(this.__failUploads ? "Uw bestand kon niet verwerkt worden": "OK");
    		});
    		this.port = port;
    	}
    	
    	start(startedCallback) {
    		this.server = this.express.listen(this.port, startedCallback);
    	}
    	
    	stop() {
        	this.server.close();
    	}
    	
    	failUploads() {
    		this.__failUploads = true;
    	}
    	
    	get uploadedFiles() {
    		return this.__uploadedFiles;
    	}
    	
    	reset() {
    		this.__failUploads = false;
    		this.__uploadedFiles = [];
    	}
    }
});
