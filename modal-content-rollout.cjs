const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content.replace(/\r\n/g, '\n'));
const gym = 'D:/Kevin/siti Web/gymtraker/client/src';
const alice = 'D:/Kevin/siti Web/aliceandkevin/client/src';

for (const root of [gym, alice]) {
  write(path.join(root, 'components/Stepper.component.tsx'), read(path.join(__dirname, 'client/src/components/Stepper.component.tsx')));
  write(path.join(root, 'styles/Stepper.styles.css'), read(path.join(__dirname, 'client/src/styles/Stepper.styles.css')));
}

const editorPath = path.join(gym, 'components/ExerciseEditor.component.tsx');
let editor = read(editorPath);
const stepperStart = editor.indexOf('            <Stepper');
const stepperEnd = editor.indexOf('          </>', stepperStart);
if (stepperStart < 0 || stepperEnd < 0) throw new Error('Missing exercise stepper');
editor = editor.slice(0, stepperStart) + `            <Stepper
              steps={steps}
              activeStep={step}
              ariaLabel={tr("Creazione esercizio")}
              disabled={busy}
              onStepClick={(next) => { setErrors({}); setStep(next); }}
            />
` + editor.slice(stepperEnd);
write(editorPath, editor);

const notificationPath = path.join(alice, 'components/NewNotificationModal.component.tsx');
let notification = read(notificationPath);
notification = notification.replace('          activeStep={notificationStep}', `          activeStep={notificationStep}
          disabled={isCreatingNotification}
          onStepClick={(next) => { setNotificationErrors({}); setNotificationStep(next as TNotificationStep); }}`);
write(notificationPath, notification);

write(path.join(alice, 'components/ManualPurchaseFields.component.tsx'), read(path.join(__dirname, 'manual-fields.tsx')));
write(path.join(alice, 'styles/ManualPurchase.styles.css'), read(path.join(__dirname, 'manual-fields.css')));
const userPath = path.join(alice, 'pages/UserManagement.page.tsx');
let user = read(userPath);
user = user.replace('import Modal from "../components/Modal.component";', 'import Modal from "../components/Modal.component";\nimport ManualPurchaseFields from "../components/ManualPurchaseFields.component";');
const modalStart = user.indexOf('      <Modal\n        isOpen={isManualPurchaseModalOpen}');
const modalEnd = user.indexOf('      </Modal>', modalStart);
if (modalStart < 0 || modalEnd < 0) throw new Error('Missing manual purchase modal');
let modal = user.slice(modalStart, modalEnd);
modal = modal.replace('              type="button"\n              variant="primary"', '              type="submit"\n              form="manual-purchase-form"\n              variant="primary"');
modal = modal.replace('              onClick={handleCreateManualPurchase}\n', '');
const bodyStart = modal.indexOf('        <div className="flex flex-col gap-5">');
if (bodyStart < 0) throw new Error('Missing manual purchase fields');
modal = modal.slice(0, bodyStart) + `        <form id="manual-purchase-form" className="manual-purchase-form"
          onSubmit={(event) => { event.preventDefault(); void handleCreateManualPurchase(); }}>
          <ManualPurchaseFields
            type={manualPurchaseForm.type}
            amount={manualPurchaseForm.amount}
            date={manualPurchaseForm.purchased_at}
            name={form.full_name}
            username={form.username}
            amountError={manualPurchaseAmountError}
            busy={isCreatingManualPurchase}
            onTypeChange={handleManualPurchaseTypeChange}
            onAmountChange={handleManualPurchaseAmountChange}
            onDateChange={handleManualPurchaseDateChange}
          />
        </form>
`;
user = user.slice(0, modalStart) + modal + user.slice(modalEnd);
for (const unused of ['  type ReactNode,\n', '  Gift,\n', '  Image as ImageIcon,\n', '  Video,\n']) user = user.replace(unused, '');
write(userPath, user);
console.log('Updated shared steppers and UserManagement extra purchase content.');
