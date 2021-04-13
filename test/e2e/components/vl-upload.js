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

  async isSuccess() {
    return this.hasAttribute('success');
  }

  async isFullBodyDrop() {
    return this.hasAttribute('full-body-drop');
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

  async getTitle() {
    return this._getTextOrSlotText('.vl-upload__element__button__container', 'title');
  }

  async getSubTitle() {
    return this._getTextOrSlotText('.vl-upload__element__label small', 'sub-title');
  }

  async _getTextOrSlotText(selector, slotSelector) {
    const element = await this.shadowRoot.findElement(By.css(selector));
    let text = await element.getText();
    if (!text) {
      const slot = await element.findElement(By.css(`slot[name="${slotSelector}"]`));
      const slotElements = await this.getAssignedNodes(slot);
      text = slotElements[0].getText();
    }
    return text;
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
    if (processing && !(success || error)) {
      await removeButton.click();
      const alert = await this.driver.switchTo().alert();
      await alert.accept();
    } else {
      await removeButton.click();
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
