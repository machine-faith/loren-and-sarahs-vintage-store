import { getStore, Contact, PitchTemplate } from './db';
import { 
  ContactProfile, 
  getContactProfile, 
  renderPitchClient 
} from './contact-profile';

export type { ContactProfile };
export { getContactProfile };

export function renderPitch(template: { subject: string; body: string }, contact: Contact, seedIndex: number = 0) {
  const store = getStore();
  const settings = store.getSettings();

  return renderPitchClient({
    templateSubject: template.subject,
    templateBody: template.body,
    contact,
    settings,
    seedIndex
  });
}

export function generateOutboxDrafts(
  contactIds: string[],
  templateId?: string,
  customSubject?: string,
  customBody?: string
) {
  const store = getStore();
  let subjectTpl = customSubject;
  let bodyTpl = customBody;

  if (!subjectTpl || !bodyTpl) {
    const template = templateId ? store.getTemplateById(templateId) : null;
    if (!template) throw new Error('Template not found');
    subjectTpl = subjectTpl || template.subject;
    bodyTpl = bodyTpl || template.body;
  }

  const created = [];
  for (let i = 0; i < contactIds.length; i++) {
    const cid = contactIds[i];
    const contact = store.getContactById(cid);
    if (!contact) continue;

    const { subject, body } = renderPitch({ subject: subjectTpl, body: bodyTpl }, contact, i);

    // Add to outbox as draft
    const item = store.addOutboxItem({
      contact_id: cid,
      subject,
      body,
      status: 'draft',
      gmail_draft_id: null,
      gmail_message_id: null,
      gmail_thread_id: null,
      sent_at: null,
      error_message: null
    });

    // Update contact stage to 'drafted'
    store.updateContact(cid, { stage: 'drafted' });
    created.push(item);
  }

  return created;
}
