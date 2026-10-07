// Demo calls. "log" fields fill the call-log sheet as the agent hears them.
// "say" (optional) is how a line is spoken when it differs from the transcript.
// "caller" is a Kokoro voice id; the agent is always af_heart (see tools/voices.py).
// Phone numbers use the fictional 555-01xx range.
window.VOXA_SCENES = [
  {
    "id": "dental", "name": "Brightside Dental", "kind": "Receptionist and booking", "dir": "Incoming call", "caller": "af_sarah", "phone": "(555) 014-2290",
    "lines": [
      {"who": "a", "text": "Hi there, thanks for calling Brightside Dental! This is Ava. How can I help you today?"},
      {"who": "c", "text": "Hey, um, I chipped my tooth this morning. Is there any chance I can get in today?", "log": {"reason": "Chipped tooth, wants a same-day visit"}, "say": "Hey, um... [sigh] I chipped my tooth this morning. Is there any chance I can get in today?"},
      {"who": "a", "text": "Oh no, I'm so sorry! Okay, let's get you sorted. So... Doctor Rao actually has an emergency opening at 3:15 this afternoon. Want me to grab it for you?", "say": "[gasp] Oh no, I'm so sorry! Okay, let's get you sorted. So... Doctor Rao actually has an emergency opening at three fifteen this afternoon. Want me to grab it for you?"},
      {"who": "c", "text": "Yes, please, that would be amazing. It's Maya Cohen.", "log": {"name": "Maya Cohen"}},
      {"who": "a", "text": "Perfect, Maya. Mm, one sec... okay, I've got your file right here. You're all booked for 3:15 today!", "say": "Perfect, Maya. Mm, one sec... okay, I've got your file right here. You're all booked for three fifteen today!", "action": "Booked emergency visit, today 3:15 pm", "log": {"email": "maya.cohen@example.com", "outcome": "Booked today, 3:15 pm with Dr. Rao"}},
      {"who": "a", "text": "I'm texting you the address and a quick link to update your insurance. Anything else I can help with?", "action": "SMS confirmation and insurance form sent", "log": {"notes": "Existing patient. Confirmation and insurance link sent by SMS."}},
      {"who": "c", "text": "No, that's it. Thank you so much!", "say": "[happy] No, that's it. Thank you so much!"},
      {"who": "a", "text": "You're so welcome. Feel better soon, Maya!", "say": "[chuckle] You're so welcome. Feel better soon, Maya!"}
    ]
  },
  {
    "id": "pizza", "name": "Lucca's Pizza", "kind": "Phone ordering", "dir": "Incoming call", "caller": "am_michael", "phone": "(555) 016-7731",
    "lines": [
      {"who": "a", "text": "Hi, thanks for calling Lucca's Pizza! Is this for pickup or delivery?"},
      {"who": "c", "text": "Delivery, please. Can I get two large pepperonis and a Caesar salad?", "log": {"reason": "Delivery order"}},
      {"who": "a", "text": "Ooh, great choice! Okay, two large pepperoni and one Caesar. Hmm, want to add garlic knots for just four dollars? Honestly, they're really good tonight.", "say": "[happy] Ooh, great choice! Okay, two large pepperoni and one Caesar. Hmm, want to add garlic knots for just four dollars? Honestly, they're really good tonight."},
      {"who": "c", "text": "Ha, okay, you got me. Sure.", "action": "Upsell accepted, garlic knots +$4.00", "say": "[laugh] Ha, okay, you got me. Sure."},
      {"who": "a", "text": "Love it! What name and address should I put on the order?", "say": "[chuckle] Love it! What name and address should I put on the order?"},
      {"who": "c", "text": "Dev Malhotra, 42 Linden Street, apartment 3.", "log": {"name": "Dev Malhotra", "notes": "42 Linden St, Apt 3. 2 large pepperoni, 1 Caesar, garlic knots."}},
      {"who": "a", "text": "Perfect, Dev. That's thirty-eight fifty, and it'll be at your door in about thirty-five minutes.", "action": "Order #2041 sent to kitchen printer", "log": {"outcome": "Order #2041, $38.50, delivery in 35 min"}},
      {"who": "a", "text": "I just texted you a secure payment link. Enjoy your dinner!", "action": "Payment link sent by SMS"}
    ]
  },
  {
    "id": "hvac", "name": "Northline Heating", "kind": "After-hours dispatch", "dir": "Incoming call, 11:48 pm", "caller": "am_fenrir", "phone": "(555) 019-4402",
    "lines": [
      {"who": "a", "text": "Northline Heating and Air, this is Ava on the after-hours line. What's going on?"},
      {"who": "c", "text": "Hi, our furnace just stopped and it's freezing in here. We have a baby at home.", "log": {"reason": "No heat, infant at home (urgent)"}, "say": "Hi... [sigh] our furnace just stopped and it's freezing in here. We have a baby at home."},
      {"who": "a", "text": "Okay. I hear you, and we're going to make this a priority, alright? Quick safety check... do you smell any gas?", "action": "Tagged urgent: no heat, infant at home"},
      {"who": "c", "text": "No, no gas. It just won't turn on.", "log": {"notes": "No gas smell. Furnace won't start."}},
      {"who": "a", "text": "Good, that helps. Can I get your name and address so our technician knows where to go?"},
      {"who": "c", "text": "Sure, it's Chris Walker, 18 Birch Lane.", "log": {"name": "Chris Walker", "notes": "18 Birch Ln. No gas smell. Furnace won't start."}},
      {"who": "a", "text": "Thanks, Chris. I'm paging our on-call technician right now. Sam will call you back within ten minutes.", "action": "On-call technician paged", "log": {"outcome": "On-call tech paged, callback within 10 min"}},
      {"who": "a", "text": "Until then, keep the baby in the warmest room and close the doors to hold the heat. You're in good hands.", "action": "Job created in field-service software"}
    ]
  },
  {
    "id": "realty", "name": "Harbor Realty", "kind": "Lead qualification", "dir": "Outbound call, 41 seconds after form fill", "caller": "am_puck", "phone": "(555) 012-8816",
    "lines": [
      {"who": "a", "text": "Hi, is this Jordan? This is Ava from Harbor Realty. You just asked about the house on Elm Street!", "log": {"name": "Jordan Lee", "email": "jordan.lee@example.com", "reason": "Web enquiry: house on Elm Street"}},
      {"who": "c", "text": "Oh wow, that was fast. Yeah, that's me.", "say": "[surprised] Oh wow, that was fast. Yeah, that's me."},
      {"who": "a", "text": "Ha, we try! So, quick question, just so I can help you best... are you hoping to buy in the next few months? And have you talked to a lender yet?", "say": "[chuckle] We try! So, quick question, just so I can help you best... are you hoping to buy in the next few months? And have you talked to a lender yet?"},
      {"who": "c", "text": "Probably within two months. And yeah, we're already pre-approved.", "action": "Qualified: pre-approved, 2-month timeline", "log": {"notes": "Pre-approved. Buying within 2 months."}},
      {"who": "a", "text": "Amazing, that makes things easy. Lena, our listing agent, can show you the house this Saturday at eleven. Does that work?", "say": "[happy] Amazing, that makes things easy. Lena, our listing agent, can show you the house this Saturday at eleven. Does that work?"},
      {"who": "c", "text": "Saturday at eleven works great.", "action": "Showing booked, Saturday 11:00 am", "log": {"outcome": "Showing booked, Sat 11:00 am with Lena"}},
      {"who": "a", "text": "Wonderful! I've sent the details to your email. See you Saturday, Jordan!", "action": "Lead and notes synced to CRM"}
    ]
  },
  {
    "id": "support", "name": "Kindred Goods", "kind": "Customer support", "dir": "Incoming call", "caller": "am_michael", "phone": "(555) 017-3359",
    "lines": [
      {"who": "a", "text": "Thanks for calling Kindred Goods, this is Ava! What can I do for you?"},
      {"who": "c", "text": "Hi, um, my order still hasn't arrived, and it's been like a week.", "log": {"reason": "Late order"}, "say": "[sigh] Hi, um, my order still hasn't arrived, and it's been like a week."},
      {"who": "a", "text": "Ugh, I'm sorry, that's so frustrating. Let me look into it right now. What's the email on the order?", "say": "[sigh] Ugh, I'm sorry, that's so frustrating. Let me look into it right now. What's the email on the order?"},
      {"who": "c", "text": "It's sam at fernmail dot com.", "log": {"email": "sam@fernmail.com"}},
      {"who": "a", "text": "Got it! Okay, one sec... yep, order 5583 is with the courier, and it's arriving tomorrow before noon.", "say": "Got it! Okay, one sec... yep, order fifty-five eighty-three is with the courier, and it's arriving tomorrow before noon.", "action": "Order #5583 looked up in store", "log": {"name": "Sam Ortiz", "notes": "Order #5583 with courier, arrives tomorrow before noon."}},
      {"who": "a", "text": "I'll text you the tracking link so you can follow it.", "action": "Tracking link sent by SMS"},
      {"who": "c", "text": "Oh, perfect. Thanks!", "say": "[happy] Oh, perfect. Thanks!"},
      {"who": "a", "text": "Anytime, Sam! Is there anything else I can help with?", "action": "Resolved without a human agent", "log": {"outcome": "Resolved, tracking link sent"}}
    ]
  }
];
