const puppeteer = require('puppeteer');
const path = require('path');
const express = require('express');

exports.onCreatePage = ({ page, actions }, { paths }) => {
  const { createPage, deletePage } = actions;
  const pagePath = page.path;
  if (paths.includes(pagePath.toString())) {
    deletePage(page);
    createPage({
      ...page,
      context: {
        downloadFile: `${pagePath}.pdf`,
      },
    });
  }
};
// Only runs during Gatsby Build process (not dev)
exports.onPostBuild = async (options, { paths, css }) => {
  console.log('\nPost Build - generating pdfs\n');
  for (let i = 0; i < paths.length; i++) {
    await printPDF(paths[i], css, i);
  }
};

async function printPDF(pageName,  i) {
  const app = express();
  app.use(express.static('public'));
  app.listen(process.env.PORT || (4040 + i));
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1000, height: 1414, isMobile: true } });
  const page = await browser.newPage();
  const url = 'http://localhost:' + ((process.env.PORT) ? process.env.port : '404' + i) + pageName;
  await page.goto(url, { waitUntil: 'networkidle2'});
  if (css) {
    await page.addStyleTag({path: path.join(
      __dirname,
      '..',
      '..',
      'src',
      'styles',
      'pdfMode.css'
    )});
  }
  await page.emulateMedia('screen');
  await page.pdf({
    format: 'A4',
    path: path.join(
      __dirname,
      '..',
      '..',
      'public',
      (pageName === '/') ? 'root.pdf' :`${pageName}.pdf`,
    ),
  });
  await browser.close();
  return;
}
