const {VlElement} = require('vl-ui-core').Test;
const {By} = require('vl-ui-core').Test.Setup;

class VlUpload extends VlElement {
  async uploadFile(path) {
    const input = await this.shadowRoot.findElement(By.css('input[type="file"].dz-hidden-input'));
    return input.sendKeys(path);
  }

  async getFiles() {
    const files = await this.shadowRoot.findElements(By.css('.vl-upload__files__container .vl-upload__file'));
    return await Promise.all(files.map((file) => new VlUploadFile(this.driver, file)));
  }

  async isError() {
    return this.hasAttribute('error');
  }

  async isFullBodyDrop() {
    return this.hasAttribute('full-body-drop');
  }

  async removeFiles() {
    const files = await this.getFiles();
    if (files) {
      await Promise.all(files.map((f) => f.remove()));
    }
  }

  async getMaximumFilesize() {
    return this.getAttribute('max-size');
  }

  async getMaximumNumberOfAllowedFiles() {
    return this.getAttribute('max-files');
  }

  async getAcceptedFileTypes() {
    return this.getAttribute('accepted-files');
  }

  async isDuplicatesDisallowed() {
    return this.hasAttribute('disallow-duplicates');
  }
}

class VlUploadFile extends VlElement {
  async getName() {
    const nameSpan = await this.findElement(By.css('span[data-dz-name]'));
    return nameSpan.getText();
  }

  async getSize() {
    const sizeSpan = await this.findElement(By.css('span[data-dz-size]'));
    return sizeSpan.getText();
  }

  async remove() {
    const success = await this.isSuccess();
    const error = await this.isError();
    const processing = await this.isProcessing();
    const removeButton = await this.findElement(By.css('button.vl-upload__file__close'));
    if (removeButton && processing && !(success || error)) {
      await removeButton.click();
      const alert = await this.driver.switchTo().alert();
      return alert.accept();
    } else {
      return removeButton.click();
    }
  }

  async getErrorMessage() {
    const errorMsg = await this.findElement(By.css('.dz-error-message'));
    return errorMsg.getText();
  }

  async isProcessing() {
    return this.hasClass('dz-processing');
  }

  async isSuccess() {
    return this.hasClass('dz-success');
  }

  async isError() {
    return this.hasClass('dz-error');
  }
}

module.exports = VlUpload;
