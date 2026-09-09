import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { syncReplies } from '@/lib/gmail';

export async function GET() {
  try {
    const store = getStore();
    const replies = store.getReplies();
    const unreadCount = replies.filter(r => !r.is_read).length;

    // Join with contact info
    const enrichedReplies = replies.map(r => ({
      ...r,
      contact: r.contact_id ? store.getContactById(r.contact_id) : null
    }));

    return NextResponse.json({ replies: enrichedReplies, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const store = getStore();

    // Support instant simulation of a reply for testing
    if (body.action === 'simulate') {
      const contacts = store.getContacts();
      const targetContact = body.contactId
        ? store.getContactById(body.contactId)
        : contacts.find(c => c.category === 'Radio') || contacts[0];

      const simulatedReply = store.addReply({
        contact_id: targetContact ? targetContact.id : null,
        gmail_thread_id: `sim-thread-${Date.now()}`,
        from_email: targetContact ? targetContact.email : 'steve.lamacq@bbc.co.uk',
        from_name: targetContact ? targetContact.name : 'Steve Lamacq',
        subject: `Re: New Music from Sydney: Love Banana — "Seagull"`,
        snippet: `Hey Henry, loving this track! The guitars are blistering. We'd love to spin "Seagull" on BBC 6 Music next Tuesday around 5:30pm...`,
        body: `Hey Henry,

Loving this track! The guitars are blistering and Mikey Young's master really brought out the bite.

We'd love to spin "Seagull" on BBC 6 Music next Tuesday around 5:30pm UK time. Keep sending music our way!

Best,
${targetContact?.name || 'Steve'}
${targetContact?.outlet || 'BBC 6 Music'}`,
        received_at: new Date().toISOString(),
        is_read: false
      });

      return NextResponse.json({
        success: true,
        simulated: true,
        reply: simulatedReply
      });
    }

    // Otherwise do live sync
    const syncResult = await syncReplies();
    const replies = store.getReplies();
    const unreadCount = replies.filter(r => !r.is_read).length;

    return NextResponse.json({
      success: true,
      syncResult,
      unreadCount,
      replies
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
