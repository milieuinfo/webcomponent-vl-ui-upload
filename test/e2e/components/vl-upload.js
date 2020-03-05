const { VlElement } = require('vl-ui-core').Test;
const { By } = require('selenium-webdriver');

class VlUpload extends VlElement { 
	async uploadFile(path) {
		const input = await this.shadowRoot.findElement(By.css('input[type="file"].dz-hidden-input'));
		return input.sendKeys(path);
	}
	
	async getFiles() {
		const files = await this.shadowRoot.findElements(By.css(".vl-upload__file"));
		return files.map(file => new VlUploadFile(file));
	}
	
	async isError() {
		return this.hasAttribute("error");
	}
	
	async removeFiles() {
		const files = await this.getFiles();
		await Promise.all(files.map(f => f.remove()));
		return this.driver.wait(async () => {
			const files = await this.getFiles();
			return files.length == 0;
		});
	}
}

class VlUploadFile {
	constructor(fileElement) {
		this.fileElement = fileElement;
	}
	
	async getName() {
		const nameSpan = await this.fileElement.findElement(By.css("span[data-dz-name]"));
		return nameSpan.getText();
	}

	async getSize() {
		const sizeSpan = await this.fileElement.findElement(By.css("span[data-dz-size]"));
		return sizeSpan.getText();
	}
	
	async remove() {
		const removeButton = await this.fileElement.findElement(By.css("button[data-dz-remove]"));
		return removeButton.click();
	}
}

module.exports = VlUpload;
