const { VlElement } = require('vl-ui-core').Test;
const { By } = require('selenium-webdriver');

class VlUpload extends VlElement { 
	async uploadFile(path) {
		const input = await this.shadowRoot.findElement(By.css('input[type="file"].dz-hidden-input'));
		return input.sendKeys(path);
	}
	
	async getFiles() {
		const files = await this.shadowRoot.findElements(By.css(".vl-upload__files__container .vl-upload__file"));
		return await Promise.all(files.map(file => new VlUploadFile(this.driver, file)));
	}
	
	async isError() {
		return this.hasAttribute("error");
	}
	
	async isFullBodyDrop() {
		return this.hasAttribute("full-body-drop");
	}
	
	async removeFiles() {
		const files = await this.getFiles();
		await Promise.all(files.map(f => f.remove()));
	}
	
	async getMaximumFilesize() {
		return this.getAttribute("max-size");
	}

	async getMaximumNumberOfAllowedFiles() {
		return this.getAttribute("max-files");
	}

	async getAcceptedFileTypes() {
		return this.getAttribute("accepted-files");
	}
	
	async isDuplicatesDisallowed() {
		const duplicatesDisallowed = await this.getAttribute("disallow-duplicates");
		return duplicatesDisallowed == "true";
	}
}

class VlUploadFile extends VlElement  {
	
	async getName() {
		const nameSpan = await this.findElement(By.css("span[data-dz-name]"));
		return nameSpan.getText();
	}

	async getSize() {
		const sizeSpan = await this.findElement(By.css("span[data-dz-size]"));
		return sizeSpan.getText();
	}
	
	async remove() {
		const removeButton = await this.findElement(By.css("button.vl-upload__file__close"));
		return removeButton.click();
	}
	
	async getErrorMessage() {
		const errorMsg = await this.findElement(By.css(".dz-error-message"));
		return errorMsg.getText();
	}

	async isProcessing() {
		const classes = await this.getClassList();
		return classes.includes("dz-processing");
	}

	async isSuccess() {
		const classes = await this.getClassList();
		return classes.includes("dz-success");
	}

	async isError() {
		const classes = await this.getClassList();
		return classes.includes("dz-error");
	}
	
	
}

module.exports = VlUpload;
