const VlUpload = require('../components/vl-upload');
const {Page} = require('vl-ui-core').Test;
const {Config} = require('vl-ui-core').Test;
const {By} = require('vl-ui-core').Test.Setup;

class VlUploadPage extends Page {
  async _getUpload(selector) {
    return new VlUpload(this.driver, selector);
  }

  async getUpload() {
    return this._getUpload('#vl-upload');
  }

  async getUploadError() {
    return this._getUpload('#vl-upload-error');
  }

  async getUploadAutoProcess() {
    return this._getUpload('#vl-upload-auto-process');
  }

  async getUploadClear() {
    return this._getUpload('#vl-upload-clear');
  }

  async getUploadMax5() {
    return this._getUpload('#vl-upload-max-5');
  }

  async getUploadMaxSize() {
    return this._getUpload('#vl-upload-max-5');
  }

  async getUploadGeenDubbels() {
    return this._getUpload('#vl-upload-geen-dubbels');
  }

  async getUploadFileTypes() {
    return this._getUpload('#vl-upload-file-types');
  }

  async getUploadFullBodyDrop() {
    return this._getUpload('#vl-upload-full-body-drop');
  }

  async listenForEventsOnUpload() {
    const addListenerButton = await this.driver.findElement(By.css('#vl-upload-listener-button'));
    return addListenerButton.click();
  }

  async getVlUploadLogText() {
    const log = await this.driver.findElement(By.css('#vl-upload-log'));
    return log.getText();
  }

  async uploadClearButton() {
    return await this.driver.findElement(By.css('#vl-upload-clear-button'));
  }

  async changeAllUploadUrlsTo(url) {
    const script = `document.querySelectorAll("vl-upload").forEach(upload => upload.setAttribute("url", "${url}"));`;
    return this.driver.executeScript(script);
  }

  async clearAllUploads() {
    const uploads = await this.driver.findElements(By.css('vl-upload'));
    await Promise.all(uploads.map((upload) => this.clearUpload(upload)));
  }

  async clearUpload(uploadElement) {
    const upload = await new VlUpload(this.driver, await uploadElement);
    return upload.removeFiles();
  }

  async uploadFiles() {
    return this.driver.executeScript(`document.querySelector("#vl-upload").upload();`);
  }

  async load() {
    await super.load(Config.baseUrl + '/demo/vl-upload.html');
  }
}

module.exports = VlUploadPage;
