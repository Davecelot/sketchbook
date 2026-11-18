import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: '<img src="sketchbook-icon.svg" alt="" height="24" style="vertical-align:middle;margin-right:8px" />Sketchbook',
    brandUrl: '.',
    brandTarget: '_self',
  }),
});
