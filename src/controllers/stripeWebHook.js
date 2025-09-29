const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const { sendCapEmail } = require('./emailController'); // reusable logic
const prisma = require('../prismaClient'); // your prisma client
const { sendCapEmail } = require('./sendEmail.controller');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Only handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Retrieve session with line_items expanded (optional)
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });

      // Parse metadata.orderData if present
      const metadataOrder = fullSession.metadata?.orderData ? JSON.parse(fullSession.metadata.orderData) : {};

      // Build order object for email + DB
      const order = {
        stripeSessionId: fullSession.id,
        orderNumber: metadataOrder.orderNumber || `CAP-${Date.now()}`,
        customerDetails: metadataOrder.customerDetails || {},
        selectedOptions: metadataOrder.selectedOptions || {},
        totalPrice: fullSession.amount_total ? fullSession.amount_total / 100 : (metadataOrder.totalPrice || 0),
        currency: (fullSession.currency || metadataOrder.currency || 'DKK').toUpperCase(),
        email: fullSession.customer_email || metadataOrder.email,
        orderDate: new Date(),
        line_items: fullSession.line_items, // optional, for email content
      };

      // Idempotency: check if we've already processed this session
      const existing = await prisma.order.findFirst({
        where: { stripeSessionId: fullSession.id },
      });

      if (existing) {
        console.log(`Webhook: session ${fullSession.id} already processed.`);
      } else {
        // Call the reusable email + DB save logic
        await sendCapEmail(order);
        console.log(`Webhook: processed session ${fullSession.id}`);
      }
    } catch (err) {
      console.error('Error processing checkout.session.completed:', err);
      // Do not throw; return 200 to acknowledge receipt to Stripe (or optionally return 500 to force retry)
    }
  }

  // Return a response to Stripe
  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
