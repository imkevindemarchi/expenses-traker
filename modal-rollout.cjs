const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'client/src/styles/Modal.styles.css'), 'utf8');
const sharedStyles = source.slice(0, source.indexOf('.modal-surface.modal-choice-surface'))
  .replace('--modal-preferred-width: 34rem;', '--modal-preferred-width: 42rem;')
  .replace('--modal-preferred-width: 48rem;', '--modal-preferred-width: 56rem;');

for (const root of ['D:/Kevin/siti Web/gymtraker', 'D:/Kevin/siti Web/aliceandkevin']) {
  const componentPath = path.join(root, 'client/src/components/Modal.component.tsx');
  const component = fs.readFileSync(componentPath, 'utf8');
  const original = 'className="flex min-h-full items-center justify-center"';
  if (!component.includes(original)) throw new Error(`Unexpected Modal layout: ${root}`);
  fs.writeFileSync(componentPath, component.replace(original,
    'className="modal-placement flex min-h-full items-center justify-center"').replace(/\r\n/g, '\n'));
  fs.writeFileSync(path.join(root, 'client/src/styles/Modal.styles.css'), sharedStyles);
  console.log(`Updated shared Modal shell: ${root}`);
}
