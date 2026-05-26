# Designer intent — checkout flow

**Input to the workflow.** This is the brief a designer would hand to an AI assistant. Plain language, no formalism.

---

I'm designing a standard e-commerce checkout flow.

The customer has items in their cart, reviews them, enters payment details, completes payment, and gets a confirmation. I need to handle the common edge cases properly:

- Declined cards (the card is rejected by the bank)
- 3D Secure challenges (the bank wants extra verification)
- Network failures during payment
- Sessions that expire mid-checkout
- Items going out of stock between adding to cart and paying
- The user navigating back at various points

Don't lose state if they refresh. Don't let them double-charge if they double-click. The whole thing should feel robust.

I want this modeled as a state machine so I can see all the states laid out, find the holes in my own design before I ship, and use it as the source of truth my code references.
