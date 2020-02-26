
const { assert, driver } = require('vl-ui-core').Test.Setup;
const VlUploadPage = require('./pages/vl-upload.page');

describe('vl-upload', async () => {
    const vlUploadPage = new VlUploadPage(driver);

    before(() => {
        return vlUploadPage.load();
    });

    it("Dummy test om de browsers te sluiten", () => {
    	assert.isTrue(true);
    });
});
