
const nodemailer = require('nodemailer');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use TLS later
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // must be an App Password
    },
  });
};



const generateWorkFlowChangeEmail = (orderItem, customer, order,currentStage) => {
  const orderItemUrl = `https://elipsestudio.com/CustomerChecker/customercheckpage.html`;

  return {
    subject: `Workflow Update for Your Order Item`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Workflow Stage Changed</h2>
        <p>Dear ${customer.firstName} ${customer.lastName},</p>
        <p>The workflow stage for one of your items in order <strong>${order.orderNumber}</strong> has been updated.</p>
        <ul>
          <li><strong>Product:</strong> ${orderItem.product?.title || "N/A"}</li>
          <li><strong>Color:</strong> ${orderItem.color || "N/A"}</li>
          <li><strong>New Stage:</strong> ${currentStage || "N/A"}</li>
          
        </ul>
        <p>You can use this token to view the order details:</p>
        <p style="font-weight: bold; font-size: 16px; color: #007cba;">${order.token}</p>
        <p>Click the link below to view your order and track the progress:</p>
        <a href="${orderItemUrl}" style="display:inline-block;padding:10px 20px;background:#007cba;color:#fff;text-decoration:none;border-radius:5px;">View Order</a>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>Your Company Team</p>
      </div>
    `,
    text: `Workflow Stage Changed - Order ${order.orderNumber}

Dear ${customer.firstName} ${customer.lastName},

The workflow stage for one of your items in order ${order.orderNumber} has been updated.

Product: ${orderItem.product?.name || "N/A"}
Color: ${orderItem.color || "N/A"}
Quantity: ${orderItem.quantity}
New Stage: ${orderItem.currentStage || "N/A"}
Updated At: ${new Date().toLocaleString()}
Updated By: ${orderItem.updatedBy || "Our Team"}

You can use this token to view the details: ${order.token}

View your order here: ${orderItemUrl}

Best regards,
Your Company Team`
  };
};



const workflowStatusChange=async(req,res)=>{

  //    try {
  //   const { id } = req.params;
  //   const {
      
  //     currentStage,
     
  //     updatedBy,
  //     // Optional: new list of sizes to replace
  //   } = req.body;

  //   const existingOrderItem = await prisma.orderItem.findUnique({
  //     where: { id: parseInt(id) },
  //     include: { order:{
  //       include:{
  //           customer:true
  //       }
  //     },
  //   product:true },
  //   });

  //   if (!existingOrderItem) {
  //     return res.status(404).json({ message: 'OrderItem not found' });
  //   }

  //   // Update main order item fields
  //   const updatedOrderItem = await prisma.orderItem.update({
  //     where: { id: parseInt(id) },
  //     data: {
        
  //       currentStage,
        
  //       updatedBy,
  //     },
  //   });

  //   const transporter = createEmailTransporter();
  //   const emailContent = generateWorkFlowChangeEmail(existingOrderItem, existingOrderItem.order.customer, existingOrderItem.order,currentStage);

  //   const mailOptions = {
  //     from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  //     to: existingOrderItem.order.customer.email,
  //     subject: emailContent.subject,
  //     html: emailContent.html,
  //     text: emailContent.text
  //   };

  //   const resultDeEmail = await transporter.sendMail(mailOptions);
    
  //   const result = await prisma.orderItem.findUnique({
  //     where: { id: parseInt(id) },
      
  //   });

  //   res.status(200).json(result);
  // } catch (error) {
  //   console.error('Update OrderItem Error:', error);
  //   res.status(500).json({ message: 'Internal Server Error', error: error.message });
  // }
    

}


const capOrderEmail = (orderData) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate
  } = orderData;

  // Format the order details for email
  const formatOptions = (options) => {
    return Object.entries(options)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return Object.entries(value)
            .map(([subKey, subValue]) => {
              if (subValue && subValue !== '' && subValue !== null) {
                return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${subKey.replace(/([A-Z])/g, ' $1').trim()}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(subValue)}</td></tr>`;
              }
              return '';
            })
            .join('');
        }
        if (value && value !== '' && value !== null) {
          return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${key.replace(/([A-Z])/g, ' $1').trim()}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value)}</td></tr>`;
        }
        return '';
      })
      .join('');
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return value.name || value.value || JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === '') {
      return 'Not specified';
    }
    return value;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
        .section { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
        .total { background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎩 Your Custom Cap Order</h1>
          <p>Order Number: ${orderNumber}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
            <p><strong>Email:</strong> ${customerDetails.email}</p>
            <p><strong>Phone:</strong> ${customerDetails.phone}</p>
            ${customerDetails.company ? `<p><strong>Company:</strong> ${customerDetails.company}</p>` : ''}
            <p><strong>Address:</strong> ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.postalCode}, ${customerDetails.country}</p>
            ${customerDetails.notes ? `<p><strong>Notes:</strong> ${customerDetails.notes}</p>` : ''}
          </div>

          <div class="section">
            <h2>Cap Configuration</h2>
            ${Object.entries(selectedOptions)
              .map(([category, options]) => {
                const hasOptions = Object.values(options).some(val => val && val !== '' && val !== null);
                if (!hasOptions) return '';
                
                return `
                  <h3>${category.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <table>
                    ${formatOptions(options)}
                  </table>
                `;
              })
              .join('')}
          </div>

          <div class="total">
            <h2>Total Amount</h2>
            <p style="font-size: 24px; margin: 0;">${totalPrice} ${currency}</p>
          </div>

          <div class="section">
            <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
            <p>Thank you for your order! We'll process it shortly and contact you if we need any additional information.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    CUSTOM CAP ORDER CONFIRMATION
    ==============================

    Order Number: ${orderNumber}
    Order Date: ${new Date(orderDate).toLocaleDateString()}

    CUSTOMER INFORMATION:
    --------------------
    Name: ${customerDetails.firstName} ${customerDetails.lastName}
    Email: ${customerDetails.email}
    Phone: ${customerDetails.phone}
    ${customerDetails.company ? `Company: ${customerDetails.company}` : ''}
    Address: ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.postalCode}, ${customerDetails.country}
    ${customerDetails.notes ? `Notes: ${customerDetails.notes}` : ''}

    CAP CONFIGURATION:
    ------------------
    ${Object.entries(selectedOptions)
      .map(([category, options]) => {
        const hasOptions = Object.values(options).some(val => val && val !== '' && val !== null);
        if (!hasOptions) return '';
        
        return `
        ${category.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}:
        ${Object.entries(options)
          .map(([key, value]) => {
            if (value && value !== '' && value !== null) {
              if (typeof value === 'object') {
                return Object.entries(value)
                  .map(([subKey, subValue]) => {
                    if (subValue && subValue !== '' && subValue !== null) {
                      return `  ${subKey.replace(/([A-Z])/g, ' $1').trim()}: ${formatValue(subValue)}`;
                    }
                    return '';
                  })
                  .join('\n');
              }
              return `  ${key.replace(/([A-Z])/g, ' $1').trim()}: ${formatValue(value)}`;
            }
            return '';
          })
          .join('\n')}
        `;
      })
      .join('\n')}

    TOTAL AMOUNT:
    -------------
    ${totalPrice} ${currency}

    Thank you for your order! We'll process it shortly.
  `;

  return {
    subject: `🎩 Cap Order Confirmation - ${orderNumber}`,
    html,
    text
  };
};
const capOrderAdminEmail = (orderData) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    email // Customer email
  } = orderData;

  // Format the order details for email
  const formatOptions = (options) => {
    return Object.entries(options)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return Object.entries(value)
            .map(([subKey, subValue]) => {
              if (subValue && subValue !== '' && subValue !== null) {
                return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${subKey.replace(/([A-Z])/g, ' $1').trim()}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(subValue)}</td></tr>`;
              }
              return '';
            })
            .join('');
        }
        if (value && value !== '' && value !== null) {
          return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${key.replace(/([A-Z])/g, ' $1').trim()}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value)}</td></tr>`;
        }
        return '';
      })
      .join('');
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return value.name || value.value || JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === '') {
      return 'Not specified';
    }
    return value;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
        .section { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
        .total { background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        .alert { background: #fef3c7; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b; margin-bottom: 15px; }
        .priority { background: #fee2e2; padding: 10px; border-radius: 5px; border-left: 4px solid #ef4444; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎩 NEW CAP ORDER RECEIVED</h1>
          <p>Order Number: ${orderNumber} | ${new Date(orderDate).toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          <div class="priority">
            <strong>🚨 ACTION REQUIRED:</strong> New order received and needs to be processed.
          </div>
          
          <div class="alert">
            <strong>📧 Customer Email:</strong> ${email}
          </div>

          <div class="section">
            <h2>👤 Customer Information</h2>
            <p><strong>Name:</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
            <p><strong>Email:</strong> ${customerDetails.email}</p>
            <p><strong>Phone:</strong> ${customerDetails.phone}</p>
            ${customerDetails.company ? `<p><strong>Company:</strong> ${customerDetails.company}</p>` : ''}
            <p><strong>Address:</strong> ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.postalCode}, ${customerDetails.country}</p>
            ${customerDetails.notes ? `<p><strong>Customer Notes:</strong> ${customerDetails.notes}</p>` : ''}
          </div>

          <div class="section">
            <h2>⚙️ Cap Configuration</h2>
            ${Object.entries(selectedOptions)
              .map(([category, options]) => {
                const hasOptions = Object.values(options).some(val => val && val !== '' && val !== null);
                if (!hasOptions) return '';
                
                return `
                  <h3>${category.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <table>
                    ${formatOptions(options)}
                  </table>
                `;
              })
              .join('')}
          </div>

          <div class="total">
            <h2>💰 Total Amount</h2>
            <p style="font-size: 24px; margin: 0;">${totalPrice} ${currency}</p>
          </div>

          <div class="section">
            <p><strong>📅 Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
            <p><strong>🔢 Order Number:</strong> ${orderNumber}</p>
            <p><strong>📧 Customer Contact:</strong> ${email}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    NEW CAP ORDER NOTIFICATION - ACTION REQUIRED
    ============================================

    Order Number: ${orderNumber}
    Order Date: ${new Date(orderDate).toLocaleString()}
    Customer Email: ${email}

    🚨 ACTION REQUIRED: New order received and needs to be processed.

    CUSTOMER INFORMATION:
    --------------------
    Name: ${customerDetails.firstName} ${customerDetails.lastName}
    Email: ${customerDetails.email}
    Phone: ${customerDetails.phone}
    ${customerDetails.company ? `Company: ${customerDetails.company}` : ''}
    Address: ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.postalCode}, ${customerDetails.country}
    ${customerDetails.notes ? `Customer Notes: ${customerDetails.notes}` : ''}

    CAP CONFIGURATION:
    ------------------
    ${Object.entries(selectedOptions)
      .map(([category, options]) => {
        const hasOptions = Object.values(options).some(val => val && val !== '' && val !== null);
        if (!hasOptions) return '';
        
        return `
        ${category.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}:
        ${Object.entries(options)
          .map(([key, value]) => {
            if (value && value !== '' && value !== null) {
              if (typeof value === 'object') {
                return Object.entries(value)
                  .map(([subKey, subValue]) => {
                    if (subValue && subValue !== '' && subValue !== null) {
                      return `  ${subKey.replace(/([A-Z])/g, ' $1').trim()}: ${formatValue(subValue)}`;
                    }
                    return '';
                  })
                  .join('\n');
              }
              return `  ${key.replace(/([A-Z])/g, ' $1').trim()}: ${formatValue(value)}`;
            }
            return '';
          })
          .join('\n')}
        `;
      })
      .join('\n')}

    TOTAL AMOUNT:
    -------------
    ${totalPrice} ${currency}

    ACTION REQUIRED: Please process this order as soon as possible.
    Customer contact: ${email}
  `;

  return {
    subject: `🎩 NEW ORDER: Cap Order : ${orderNumber} - ${customerDetails.firstName} ${customerDetails.lastName}`,
    html,
    text
  };
};


const sendCapEmail = async (order) => {
  try {
    const transporter = createEmailTransporter();

    const emailContent = capOrderEmail(order);
    const emailContentAdmin = capOrderAdminEmail(order);

    // send both emails in parallel
    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: order.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
      transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'mahmedzaki670@gmail.com',
        subject: emailContentAdmin.subject,
        html: emailContentAdmin.html,
        text: emailContentAdmin.text,
      }),
    ]);

    // Save order in DB
    // await prisma.order.create({
    //   data: {
    //     orderNumber: order.orderNumber,
    //     customerDetails: order.customerDetails,
    //     selectedOptions: order.selectedOptions,
    //     totalPrice: order.totalPrice,
    //     currency: order.currency,
    //     customerEmail: order.email,
    //     status: 'PAID',
    //     stripeSessionId: order.stripeSessionId, // ensure this field exists in DB
    //     orderDate: order.orderDate,
    //   },
    // });

    console.log('Email sent and order saved:', order.orderNumber);
  } catch (err) {
    console.error('sendCapEmailLogic error:', err);
    // decide whether to bubble up error or log and continue
    throw err;
  }
};

// const stripePayment=async (req,res) => {
//   const { orderNumber, totalPrice, email } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       customer_email: email,
//       line_items: [
//         {
//           price_data: {
//             currency: "dkk",
//             product_data: {
//               name: `Cap Order : ${orderNumber}`,
//             },
//             unit_amount: totalPrice * 100, // Stripe expects øre (cents)
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: "http://elipsestudio.com/studentlife/success?session_id={CHECKOUT_SESSION_ID}",
// cancel_url: "http://elipsestudio.com/studentlife/cancel",
//     });

//     res.json({ id: session.id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }

// }

const stripePayment = async (req, res) => {
  try {
    const orderData = req.body.orderData; // frontend sends the whole orderData object
    const { orderNumber, totalPrice, email } = orderData;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: (orderData.currency || 'DKK').toLowerCase(),
            product_data: { name: `Cap Order : ${orderNumber}` },
            unit_amount: Math.round(parseFloat(totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'hhttp://elipsestudio.com/studentlife/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://elipsestudio.com/studentlife/cancel',
      metadata: {
        // put whatever you need in metadata; stringify complex objects
        orderData: JSON.stringify(orderData),
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Create Checkout Session Error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSessionDetails = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
    workflowStatusChange,sendCapEmail,stripePayment,getSessionDetails                                                  
};
