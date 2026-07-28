export const systemPrompt = `Role: "You are SupportBot, a support agent for SKS enterprise. You handle refund/return requests."
Behavior rules: always check order status before responding; never promise a refund over some dollar threshold without escalating; must cite the specific policy clause used for any decision.
Tone constraint: professional, concise, no over-promising. `;

export const POLICY_TEXT = `
RetailNow Returns & Refunds Policy (Effective January 2026)

Section 1: Standard Return Window
Customers may return most items within 30 days of delivery for a full refund,
provided the item is unused and in its original packaging. Refunds are issued
to the original payment method within 5-7 business days of the returned item
being received at our warehouse. Items marked as final sale, including
clearance and personalized products, are not eligible for return under this
section.

Section 2: Late Delivery Compensation
If an order's estimated delivery date passes by more than 3 business days
without the item arriving, the customer is eligible for a partial refund of
shipping costs. If the delay exceeds 7 business days, the customer may
request a full refund of the order regardless of item condition, or opt to
continue waiting for delivery with a 15% credit issued to their account.
Delays caused by customs holds or address errors on the customer's part are
excluded from this policy.

Section 3: Escalation Thresholds
Support agents may approve refunds up to $150 without additional review.
Requests between $150 and $500 require a supervisor tag before processing.
Any refund request exceeding $500, or any case involving a customer's third
reported issue within 90 days, must be escalated to a human agent rather
than resolved automatically.

Section 4: Non-Returnable Items
Perishable goods, gift cards, and digital downloads are non-returnable under
any circumstances. Damaged-on-arrival claims for these categories should be
escalated directly rather than processed as a standard refund.
`;

export const fakeHistory = [
  {
    role: "user",
    parts: [{ text: "Hi, my order #ORD-12345 was supposed to arrive 5 days ago and I still don't have it. I'd like a refund." }],
  },
  {
    role: "model",
    parts: [{ functionCall: { name: "get_order_details", args: { order_id: "ORD-12345" } } }],
  },
  {
    role: "user",
    parts: [{
      functionResponse: {
        name: "get_order_details",
        response: {
          status: "in_transit",
          expected_delivery: "2026-07-20",
          days_late: 6,
          items: ["Wireless Headphones - Black"],
          order_total: 89.99,
        },
      },
    }],
  },
  {
    role: "model",
    parts: [{ functionCall: { name: "search_policy_kb", args: { query: "late delivery refund eligibility" } } }],
  },
  {
    role: "user",
    parts: [{
      functionResponse: {
        name: "search_policy_kb",
        response: {
          result: `Non-Returnable Items
Perishable goods, gift cards, and digital downloads are non-returnable under
any circumstances. Damaged-on-arrival claims for these categories should be
escalated directly rather than processed as a standard refund.`,
        },
      },
    }],
  },
];

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  // 1. dot product: loop through both arrays, sum a[i] * b[i]
  // 2. magnitude of a: sqrt of sum of a[i]^2
  // 3. magnitude of b: same, for b
  // 4. return dot / (magA * magB)
  if (vecA.length !== vecB.length) {
    return 0
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] ?? 0), 0);
  const magnitudeA = Math.hypot(...vecA);
  const magnitudeB = Math.hypot(...vecB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

export const policySections = [
  `Standard Return Window
Customers may return most items within 30 days of delivery for a full refund,
provided the item is unused and in its original packaging. Refunds are issued
to the original payment method within 5-7 business days of the returned item
being received at our warehouse. Items marked as final sale, including
clearance and personalized products, are not eligible for return under this
section.
`,
  `Late Delivery Compensation
If an order's estimated delivery date passes by more than 3 business days
without the item arriving, the customer is eligible for a partial refund of
shipping costs. If the delay exceeds 7 business days, the customer may
request a full refund of the order regardless of item condition, or opt to
continue waiting for delivery with a 15% credit issued to their account.
Delays caused by customs holds or address errors on the customer's part are
excluded from this policy.
`,
  ` Escalation Thresholds
Support agents may approve refunds up to $150 without additional review.
Requests between $150 and $500 require a supervisor tag before processing.
Any refund request exceeding $500, or any case involving a customer's third
reported issue within 90 days, must be escalated to a human agent rather
than resolved automatically.
`,
  ` Non-Returnable Items
Perishable goods, gift cards, and digital downloads are non-returnable under
any circumstances. Damaged-on-arrival claims for these categories should be
escalated directly rather than processed as a standard refund.`
]

