import { CbcInterfacePage } from './app.po';

describe('cbc-interface App', () => {
  let page: CbcInterfacePage;

  beforeEach(() => {
    page = new CbcInterfacePage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
