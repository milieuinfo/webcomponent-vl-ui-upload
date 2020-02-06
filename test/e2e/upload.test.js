
const { assert, driver } = require('vl-ui-core').Test.Setup;
const VlUploadPage = require('./pages/vl-upload.page');

describe('vl-upload', async () => {
    const vlUploadPage = new VlUploadPage(driver);

    before((done) => {
        vlUploadPage.load().then(() => {
            done();
        });
    });
    
    after(async () => { 
        return driver.quit();
    });
});
