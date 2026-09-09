import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { renderPitchClient } from '@/lib/contact-profile';

export async function POST(request: Request) {
  try {
    const store = getStore();
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const res = store.approveLead(leadId);
    if (!res) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const { lead, contact } = res;
    let outboxItem = null;

    // If direct email, automatically queue an outbox pitch
    if (lead.pitchEmail && lead.submissionType === 'direct_email') {
      const templates = store.getTemplates();
      const settings = store.getSettings();

      // Pick template matching category
      let template = templates.find(t => t.target_category.toLowerCase() === contact.category.toLowerCase());
      if (!template) {
        template = templates[0];
      }

      if (template) {
        const rendered = renderPitchClient({
          templateSubject: template.subject,
          templateBody: template.body,
          contact,
          settings
        });

        outboxItem = store.addOutboxItem({
          contact_id: contact.id,
          subject: rendered.subject,
          body: rendered.body,
          status: 'draft',
          gmail_draft_id: null,
          gmail_message_id: null,
          gmail_thread_id: null,
          sent_at: null,
          error_message: null
        });
      }
    }

    return NextResponse.json({
      success: true,
      lead,
      contact,
      outboxItem,
      message: outboxItem 
        ? `Lead approved, added to Contacts, and queued in Outbox.` 
        : `Lead approved and added to Contacts.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
