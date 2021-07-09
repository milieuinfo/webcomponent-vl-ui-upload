import { html } from 'lit-html';
import '../vl-upload.js';
import '../style.css';

export default {
  title: 'Components/Upload',
};

const Template = (props) => {
  return html` <vl-upload
    ?data-vl-disabled=${props.disabled}
    ?data-vl-success=${props.success}
    ?data-vl-error=${props.error}
    data-vl-input-name="files"
    url="http://httpbin.org/post"
    id="vl-upload"
  ></vl-upload>`;
};

export const Default = Template.bind({});

Default.args = {
  disabled: false,
  success: false,
  error: false,
};
