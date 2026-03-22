// app/api/send-order-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface OrderData {
  fullName: string
  email: string
  phone: string
  address: string
  cartItems: Array<{
    item: {
      id: string
      name: string
      price: number
    }
    quantity: number
  }>
  totalPrice: number
  couponCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderData = await request.json()
    
    const { fullName, email, phone, address, cartItems, totalPrice, couponCode } = body

    // Validate required fields
    if (!fullName || !email || !phone || !address || !cartItems || totalPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate order ID (you can use a database instead)
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Format cart items HTML
    const cartItemsHtml = cartItems
      .map(
        ({ item, quantity }) =>
          `<li style="margin-bottom: 8px;">
            <strong>${item.name}</strong> x${quantity} - ₹${(item.price * quantity).toLocaleString()}
          </li>`
      )
      .join('')

    // Generate HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Order Confirmed!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Dear <strong>${fullName}</strong>,</p>

          <p style="font-size: 15px; color: #555;">
            Thank you for ordering official <strong>TECHNICIA'25 Merchandise</strong>! Your order has been successfully confirmed.
          </p>

          <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 10px 0; color: #666;">
              <strong>Order ID:</strong> ${orderId}
            </p>
            <p style="margin: 0 0 10px 0; color: #666;">
              <strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}
            </p>
            <p style="margin: 0; color: #666;">
              <strong>Phone:</strong> ${phone}
            </p>
          </div>

          <h3 style="color: #1f2937; margin-top: 25px; margin-bottom: 10px;">Order Summary</h3>
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${cartItemsHtml}
            </ul>
            <div style="border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 12px; display: flex; justify-content: space-between;">
              <strong style="color: #1f2937;">Total Amount:</strong>
              <strong style="color: #22c55e; font-size: 18px;">₹${totalPrice.toLocaleString()}</strong>
            </div>
            ${couponCode ? `<p style="color: #059669; margin-top: 10px; margin-bottom: 0;"><strong>✓ Coupon Applied:</strong> ${couponCode}</p>` : ''}
          </div>

          <h3 style="color: #1f2937; margin-top: 25px; margin-bottom: 10px;">Delivery Address</h3>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #22c55e; color: #166534;">
            ${address.split('\n').join('<br/>')}
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏱️ Next Steps:</strong> Your merchandise will be processed and shipped soon. We will notify you once it is on the way.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              For any queries regarding your order, feel free to reply to this email or contact us at 
              <a href="mailto:official@technicia.live" style="color: #22c55e; text-decoration: none;">official@technicia.live</a>.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px; margin-bottom: 0;">
              Thank you for Participating in TECHNICIA'25!
            </p>
          </div>
        </div>

        <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          <p style="margin: 0 0 5px 0;"><strong>Merchandise Team – TECHNICIA'25</strong></p>
          <p style="margin: 0;">ISTE Student Chapter | Chandigarh University</p>
        </div>
      </div>
    `

    // Send email
    const mailOptions = {
      from: `"TECHNICIA'25 Merchandise" <${process.env.EMAIL_USER}>`,
      to: email,
      cc: "admin@searchyourmerch.com",
      subject: `✅ Your Merchandise Order Confirmation | ${orderId}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Order confirmation email sent:', {
      orderId,
      email,
      messageId: info.messageId,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Order confirmation email sent successfully',
        orderId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send order confirmation email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}