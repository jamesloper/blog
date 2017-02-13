---
layout: post
title:  "Recurring Billing, Zipcodes & CVC"
categories: life
---

Although card processing errors can be a black box of caveats, some rules are known. The nature of recurring billing charges causes some complication, but here's some of the stuff I learned.

- When you attach the card to a customer, your first line of defense is the CVC. With the right settings, passing an incorrect CVC will reject the API call with an HTTP error and prevent an invalid card from being added. That is all the CVC is good for unfortunately. But great as a preventative measure.
- Nobody is allowed to store CVC due to PCI compliance, so recurring charges therefore execute without CVC every time. Without the CVC, the bank sees a charge with no magstripe or chip present. This obviously looks very suspicious and the slightest jitter will cause it to fail. Include some form of Address Verification information with the request you make when you attach a card to a user. You can collect the full billing address from the customers if you want to eradicate card errors, but collecting just the billing zipcode is a good middle ground.
- MasterCard is the only company that encourages a name field. The general consensus is that if you have to name of the customer go ahead and include it, but it's not a huge difference.
