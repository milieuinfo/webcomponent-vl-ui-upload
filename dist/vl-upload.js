import {vlElement, define} from '/node_modules/vl-ui-core/dist/vl-core.js';
import '/node_modules/vl-ui-icon/dist/vl-icon.js';
import '/node_modules/@govflanders/vl-ui-util/dist/js/util.js';
import '/node_modules/@govflanders/vl-ui-core/dist/js/core.js';
import '/node_modules/vl-ui-upload/lib/upload.js';

/**
 * VlUpload
 * @class
 * @classdesc Gebruik de upload component om één of meerdere bestanden te selecteren of te slepen naar het upload veld. De gebruiker kan alternatief ook één of meerdere bestanden uploaden door op de link in het upload veld te klikken en de bestanden te selecteren in het Bestand menu.
 *
 * @extends HTMLElement
 * @mixes vlElement
 *
 * @property {URL} data-vl-url - Attribuut om de url naar waar de component moet uploaden, te definiëren.
 * @property {string} data-vl-input-name - Attribuut om de key te definiëren waarmee het bestand wordt opgeladen.
 * @property {string} data-vl-error-message-filesize - Attribuut om de message te definiëren wanneer er te grote bestanden zijn toegevoegd.
 * @property {string} data-vl-error-message-accepted-files - Attribuut om de message te definiëren wanneer er niet-geaccepteerde bestanden zijn toegevoegd.
 * @property {string} data-vl-error-message-maxfiles - Attribuut om de message te definiëren wanneer er teveel bestanden zijn toegevoegd.
 * @property {number} data-vl-max-files - Attribuut om het maximaal aantal bestanden dat opgeladen mag worden, aan te duiden.
 * @property {number} data-vl-max-size - Attribuut om de maximum grootte van een bestand dat opgeladen kan worden (20000000 = 2MB), aan te duiden.
 * @property {list} data-vl-accepted-files - Attribuut om te op te lijsten welke bestanden worden geaccepteerd door component (extensie en mimetype).
 * @property {boolean} data-vl-full-body-drop - Attribuut om te activeren of deactiveren dat het de dropzone over het heel scherm is.
 * @property {boolean} data-vl-autoprocess - Attribuut om te activeren of deactiveren dat het het gedropte bestand direct moet opgeladen worden.
 *
 * @see {@link https://www.github.com/milieuinfo/webcomponent-vl-ui-upload/releases/latest|Release notes}
 * @see {@link https://www.github.com/milieuinfo/webcomponent-vl-ui-upload/issues|Issues}
 * @see {@link https://webcomponenten.omgeving.vlaanderen.be/demo/vl-upload.html|Demo}
 */
export class VlUpload extends vlElement(HTMLElement) {
  static get _observedAttributes() {
    return ['url', 'input-name', 'error-message-filesize', 'error-message-accepted-files',
      'error-message-maxfiles', 'max-files', 'max-size', 'accepted-files', 'full-body-drop', 'autoprocess',
      'disallow-duplicates'];
  }

  static get _observedChildClassAttributes() {
    return ['error'];
  }

  get _classPrefix() {
    return 'vl-upload--';
  }

  constructor() {
    super(`
      <style>
        @import '/node_modules/vl-ui-upload/dist/style.css';
        @import '/node_modules/vl-ui-link/dist/style.css';
        @import '/node_modules/vl-ui-icon/dist/style.css';
      </style>
      <div class="vl-upload" data-vl-upload data-vl-upload-url="http://www.example.com"></div>
    `);
  }

  connectedCallback() {
    this._appendTemplates();
    this.dress();
  }

  get _upload() {
    return this._element;
  }

  get _dressed() {
    return !!this.getAttribute('data-vl-upload-dressed');
  }

  get _dropzone() {
    if (vl && vl.upload && vl.upload.dropzoneInstances) {
      return vl.upload.dropzoneInstances.filter((dropzone) => dropzone.element === this._element)[0];
    }
  }

  /**
   * Geeft het upload element.
   * @return {HTMLElement}
   */
  get uploadElement() {
    return this.shadowRoot.querySelector('.vl-upload__element');
  }

  /**
   * Haal de geaccepteerde bestanden (zonder error) op, die toegevoegd zijn aan de dropzone.
   * @return {File[]}
   */
  get acceptedFiles() {
    return this._dropzone.getAcceptedFiles();
  }

  /**
   * Haal de niet-geaccepteerde bestanden (met error) op, die toegevoegd zijn aan de dropzone.
   * @return {File[]}
   */
  get rejectedFiles() {
    return this._dropzone.getRejectedFiles();
  }

  /**
   * Haal alle bestanden op die toegevoegd zijn aan de dropzone.
   * @return {File[]}
   */
  get files() {
    return this._dropzone.files;
  }

  get _hasUploadTemplate() {
    return document.body.querySelector('#uploadTemplate');
  }

  get _hasPreviewFilesWrapperTemplate() {
    return document.body.querySelector('#previewFilesWrapper');
  }

  get _hasPreviewTemplate() {
    return document.body.querySelector('#previewTemplate');
  }

  get _hasUploadOverlayTemplate() {
    return document.body.querySelector('#uploadOverlay');
  }

  get _uploadTemplate() {
    return this._template(`
      <template id="uploadTemplate">
        <div class="vl-upload__element">
          <div class="vl-upload__element__label">
            <button type="button" class="vl-upload__element__button vl-link">
              <span is="vl-icon" data-vl-icon="paperclip"></span>
              <span class="vl-upload__element__button__container"></span>
            </button>
            <small></small>
          </div>
        </div>
      </template>
    `);
  }

  get _previewFilesWrapperTemplate() {
    return this._template(`
      <template id="previewFilesWrapper">
        <div class="vl-upload__files">
          <div class="vl-upload__files__container"></div>
          <div class="vl-upload__files__input__container"></div>
          <button class="vl-upload__files__close vl-link vl-link--icon">
            <span is="vl-icon" data-vl-icon="trash" data-vl-link></span>
            Verwijder alle bestanden
          </button>
        </div>
      </template>
    `);
  }

  get _previewTemplate() {
    return this._template(`
      <template id="previewTemplate">
        <div class="vl-upload__file">
          <p class="vl-upload__file__name">
            <span is="vl-icon" class="vl-upload__file__name__icon" data-vl-icon="document"></span>
            <span data-dz-name></span>
            <span class="vl-upload__file__size">
              (<span data-dz-size></span>)
            </span>
          </p>
          <div class="dz-error-message">
            <span data-dz-errormessage></span>
          </div>
          <button type="button" class="vl-upload__file__close vl-link vl-link--icon" data-dz-remove>
            <span is="vl-icon" data-vl-icon="cross"></span>
          </button>
        </div>
      </template>
    `);
  }

  get _uploadOverlayTemplate() {
    return this._template(`
      <template id="uploadOverlay">
        <div class="vl-upload__overlay">
          <p class="vl-upload__overlay__text">
            <span is="vl-icon" data-vl-icon="paperclip" link></span>
          </p>
        </div>
      </template>
    `);
  }

  get _prefix() {
    return 'data-vl-upload-';
  }

  /**
   * Initialiseer de modal config.
   * @return {void}
   */
  dress() {
    if (!this._dressed) {
      vl.upload.dress(this._upload);
    }
  }

  /**
   * Handmatig de upload aanroepen. Indien een url gegeven is, laad op naar die url.
   * @param {String} url
   * @return {void}
   */
  upload(url) {
    if (url) {
      this._dropzone.options.url = url;
    }
    this._dropzone.processQueue();
  }

  /**
   * Verwijder alle files in de dropzone.
   * @return {void}
   */
  clear() {
    this._dropzone.removeAllFiles();
  }

  /**
   * Wrapper om alle events te kunnen catchen van de upload (zoals vl.upload.hook.fileChange alsook de events van [DropZoneJs]{@link https://www.dropzonejs.com/#event-list})
   * @param {String} event
   * @param {Function} callback
   * @return {void}
   */
  on(event, callback) {
    this._element.addEventListener(event, callback);
  }

  _urlChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'url', newValue);
    if (this._dropzone && this._dropzone.options) {
      this._dropzone.options.url = newValue;
    }
  }

  _inputNameChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'input-name', newValue);
  }

  _errorMessageFilesizeChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'error-message-filesize',
        newValue);
  }

  _errorMessageAcceptedFilesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'error-message-accepted-files',
        newValue);
  }

  _errorMessageMaxfilesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'error-message-maxfiles',
        newValue);
  }

  _maxFilesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'max-files', newValue);
  }

  _maxSizeChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'max-size', newValue);
  }

  _acceptedFilesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'accepted-files', newValue);
    this._element.setAttribute('accept', newValue);
  }

  _fullBodyDropChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'full-body-drop', '');
  }

  _autoprocessChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix + 'autoprocess', newValue);
  }

  _disallowDuplicatesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'disallow-duplicates', newValue);
  }

  _appendTemplates() {
    if (!this._hasUploadTemplate) {
      document.body.appendChild(this._uploadTemplate);
    }

    if (!this._hasPreviewFilesWrapperTemplate) {
      document.body.appendChild(this._previewFilesWrapperTemplate);
    }

    if (!this._hasPreviewTemplate) {
      document.body.appendChild(this._previewTemplate);
    }

    if (!this._hasUploadOverlayTemplate) {
      document.body.appendChild(this._uploadOverlayTemplate);
    }
  }
}

define('vl-upload', VlUpload);
