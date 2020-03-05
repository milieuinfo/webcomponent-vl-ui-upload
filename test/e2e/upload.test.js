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
//    	return vlUploadPage.clearAllUploads();
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
    
//    it("Als gebruiker kan ik een bestand selecteren om op te laden", async () => {
//    	const upload = await vlUploadPage.getUpload();
//    	const file = path.resolve(__dirname, './bestand.pdf');
//    	await upload.uploadFile(file);
//    	const files = await upload.getFiles();
//    	assert.equal(files.length, 1);
//    	await assert.eventually.equal(files[0].getName(), "bestand.pdf");
//    	await assert.eventually.equal(files[0].getSize(), "13.1 KB");
//    	assert.equal(fileUploadServer.uploadedFiles.length, 0);
//    });
//   
//    it("Als gebruiker kan ik verschillende bestanden selecteren om op te laden en ze dan programmatorisch opladen", async () => {
//    	const upload = await vlUploadPage.getUpload();
//    	const file = path.resolve(__dirname, './bestand.pdf');
//    	await upload.uploadFile(file);
//    	const files = await upload.getFiles();
//    	assert.equal(files.length, 1);
//    	await vlUploadPage.uploadFiles();
//    	await driver.wait(async () => {
//    		return fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == "bestand.pdf";
//    	});
//    });
    
    it("Als gebruiker kan ik een  bestand direct laten opladen bij het selecteren", async () => {
    	const upload = await vlUploadPage.getUploadAutoProcess();
    	const file = path.resolve(__dirname, './bestand.pdf');
    	await upload.uploadFile(file);
    	await driver.wait(async () => {
    		const files = await upload.getFiles();
            return files.length == 1 && fileUploadServer.uploadedFiles.length == 1 && fileUploadServer.uploadedFiles[0] == "bestand.pdf";
        });
    });
    
    it("Als gebruiker zie ik een foutboodschap bij een bestand als het opladen mislukt", async () => {
    	const upload = await vlUploadPage.getUploadAutoProcess();
    	await upload.removeFiles();
    	const file = path.resolve(__dirname, './bestand.pdf');
//    	fileUploadServer.failUploads();
//    	await upload.uploadFile(file);
    	const files = await upload.getFiles();
    	assert.equal(files.length, 0);
    });
//    
//    it("Als gebruiker zie ik het onderscheid tussen een gewone upload en een upload in error state", async () => {
//    	const upload = await vlUploadPage.getUpload();
//    	const uploadError = await vlUploadPage.getUploadError();
//    	await assert.eventually.isFalse(upload.isError());
//    	await assert.eventually.isTrue(uploadError.isError());
//    });
    
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
    			response.status(this.__failUploads ? 500: 200);
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
