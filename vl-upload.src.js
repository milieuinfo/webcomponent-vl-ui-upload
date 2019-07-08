import {VlElement, define} from '/node_modules/vl-ui-core/vl-core.js';

(() => {
  loadScript('util.js',
      '/node_modules/@govflanders/vl-ui-util/dist/js/util.min.js', () => {
        loadScript('core.js',
            '/node_modules/@govflanders/vl-ui-core/dist/js/core.min.js', () => {
              loadScript('upload.js',
                  '../dist/upload.js');
            });
      });

  function loadScript(id, src, onload) {
    if (!document.head.querySelector('#' + id)) {
      let script = document.createElement('script');
      script.setAttribute('id', id);
      script.setAttribute('src', src);
      script.onload = onload;
      document.head.appendChild(script);
    }
  }
})();

/**
 * VlUpload
 * @class
 * @classdesc Gebruik de upload component om één of meerdere bestanden te selecteren of te slepen naar het upload veld. De gebruiker kan alternatief ook één of meerdere bestanden uploaden door op de link in het upload veld te klikken en de bestanden te selecteren in het Bestand menu. <a href="demo/vl-upload.html">Demo</a>.
 *
 * @extends VlElement
 */
export class VlUpload extends VlElement(HTMLElement) {

  static get _observedAttributes() {
    return ['url', 'input-name', 'error-message-filesize', 'error-message-accepted-files',
      'error-message-maxfiles', 'max-files', 'max-size', 'accepted-files', 'full-body-drop', 'autoprocess'];
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
                @import '../style.css';
                @import '/node_modules/vl-ui-link/style.css';
                @import '/node_modules/vl-ui-icon/style.css';
            </style>
            <div class="vl-upload" data-vl-upload data-vl-upload-url="http://www.example.com">
            </div>
        `);
  }

  connectedCallback() {
    this.dress();
  }

  get _upload() {
    return this._element;
  }

  get _dressed() {
    return !!this.getAttribute('data-vl-upload-dressed');
  }

  get _dropzone() {
    return vl.upload.dropzoneInstances.filter(dropzone => dropzone.element === this._element)[0];
  }

  /**
   * Haal de geaccepteerde bestanden (zonder error) op, die toegevoegd zijn aan de dropzone.
   * @returns {File[]}
   */
  get acceptedFiles() {
    return this._dropzone.getAcceptedFiles();
  }

  /**
   * Haal de niet-geaccepteerde bestanden (met error) op, die toegevoegd zijn aan de dropzone.
   * @returns {File[]}
   */
  get rejectedFiles() {
    return this._dropzone.getRejectedFiles();
  }

  /**
   * Haal alle bestanden op die toegevoegd zijn aan de dropzone.
   * @returns {File[]}
   */
  get files() {
    return this._dropzone.files;
  }

  get _templates() {
    return this._template(`
        <template id="uploadTemplate">
          <div class="vl-upload__element">
            <div class="vl-upload__element__label">
              <button type="button" class="vl-upload__element__button vl-link">
                <i class="vl-vi vl-vi-paperclip" aria-hidden="true"></i>
                <span class="vl-upload__element__button__container"></span>
              </button>
              <small></small>
            </div>
          </div>
        </template>
    
        <template id="previewFilesWrapper">
          <div class="vl-upload__files">
            <div class="vl-upload__files__container"></div>
            <div class="vl-upload__files__input__container"></div>
            <button class="vl-upload__files__close vl-link vl-link--icon">
              <span class="vl-link__icon vl-vi vl-vi-trash" aria-hidden="true"></span>
              Verwijder alle bestanden
            </button>
          </div>
        </template>
    
        <template id="previewTemplate">
          <div class="vl-upload__file">
            <p class="vl-upload__file__name">
              <span class="vl-upload__file__name__icon vl-vi vl-vi-document" aria-hidden="true"></span>
              <span data-dz-name></span>
              <span class="vl-upload__file__size">
            (<span data-dz-size></span>)
          </span>
            </p>
            <div class="dz-error-message">
              <span data-dz-errormessage></span>
            </div>
            <button type="button" class="vl-upload__file__close vl-link vl-link--icon" data-dz-remove>
              <span class="vl-vi vl-vi-cross" aria-hidden="true"></span>
            </button>
          </div>
        </template>
    
        <template id="uploadOverlay">
          <div class="vl-upload__overlay">
            <p class="vl-upload__overlay__text">
              <span class="vl-link__icon vl-vi vl-vi-paperclip" aria-hidden="true"></span>
            </p>
          </div>
        </template>`);
  }

  get _prefix() {
    return 'data-vl-upload-';
  }

  /**
   * Initialiseer de modal config.
   */
  dress() {
    (async () => {
      while (!window.vl || !window.vl.upload) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!this._dressed) {
        document.body.appendChild(this._templates)
        vl.upload.dress(this._upload);
      }
    })();
  }

  /**
   * Handmatig de upload aanroepen. Indien een url gegeven is, laad op naar die url.
   * @param url
   */
  upload(url) {
    if (url) {
      this._dropzone.options.url = url;
    }
    this._dropzone.processQueue();
  }

  /**
   * Verwijder alle files in de dropzone.
   */
  clear() {
    this._dropzone.removeAllFiles();
  }

  /**
   * Wrapper om alle events te kunnen catchen van de upload (zoals vl.upload.hook.fileChange)
   * @param event
   * @param callback
   */
  on(event, callback) {
    this._element.addEventListener(event, callback);
  }

  _urlChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'url', newValue);
  }

  _input_nameChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'input-name', newValue);
  }

  _error_message_filesizeChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'error-message-filesize', newValue);
  }

  _error_message_accepted_filesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'error-message-accepted-files', newValue);
  }

  _error_message_maxfilesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'error-message-maxfiles', newValue);
  }

  _max_filesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'max-files', newValue);
  }

  _max_sizeChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'max-size', newValue);
  }

  _accepted_filesChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'accepted-files', newValue);
    this._element.setAttribute('accept', newValue);
  }

  _full_body_dropChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'full-body-drop', '');
  }

  _autoprocessChangedCallback(oldValue, newValue) {
    this._element.setAttribute(this._prefix+'autoprocess', newValue);
  }

}

define('vl-upload', VlUpload);