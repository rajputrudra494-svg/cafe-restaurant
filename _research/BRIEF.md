# P'S Delicacies: research brief (collected 13 Oct 2026)

## Facts (verified from the sources listed)
- Founders: Mr. Prashant Patel and his wife came back from Canada and opened the first store in Bardoli in 2013 (IndiaMART + psdelicacies.com About page).
- Pure vegetarian, Italian-style pizza, uses a specialised oven, some imported ingredients.
- Bardoli head office: 52-59 Suken Residency, Baben, Bardoli, Gujarat 394601 (lat 21.1438733, lng 73.091353), owner listed as "PRASANT BHAI" (site API Load_Branch).
- Surat outlet (Instagram bio): Shop No. G-3, International Wealth Center, VIP Road, Vesu, Surat 395007. Bio: "Same legendary pizza. New city. New cravings".
- Phones 9537246200 / 8980918008, email palskits14u@gmail.com. Instagram @psdelicacies (~2.9k followers), Facebook /PSdelicacies.
- Hours: NOT published anywhere reliable (IndiaMART says 9-7, which looks like a supplier listing). Don't invent them.
- Taglines (official site): "Pizzas that talk to your taste buds", "Cheese so good that melts in your mouth", "Delicious pizzas with the perfection of each topping".
- Reviews on official site: Ankit Sharma (paneer chilli pizza 12", crust neither fluffy nor hard, priced like the big chains), Jay Dhanani (from Surat, pizza/garlic bread/pasta fresh, better than international brands). Tripadvisor 4.4/5 (~20 reviews), seen only in a search summary, so confirm before using.
- Sizes: MED 10", LG 12", XLG 14", JUM 16".
- Full menu: js/menu-data.js (143 items, scraped from the site's psmenu.aspx/Load_Menu API, typos fixed).

## Brand / ambience
- Logo: red #E8312F circle with a white brush "P" and a yellow #F5B700 slice pulled out. Vector versions are in assets/brand (logo.svg, mark.svg, wordmark.svg).
- Surat interior (from Instagram): warm grey concrete walls with raised P'S DELICACIES lettering, red-painted exposed steel ceiling grid, wood-slat ceiling, light stone counters, white tables. Staff wear red t-shirts and caps. Red pizza boxes say "HOT...HOT...HOT...!!!". There's a chef statue at the glass storefront.
- Food photos are dark wood with pizzas on wooden peels (assets/img, 1920px WebP). Cut-outs are cut-*.webp. Instagram tiles are in assets/ig. Concrete textures are concrete.webp and concrete-dark.webp.
- Voice: playful and short, e.g. "Not your regular Pizza, not trying to be either."

## Planned build (static HTML/CSS/JS like the earlier sites)
index.html, css/style.css, js/main.js (GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.13), js/pizza3d.js (three@0.160.0 via import map).
- 3D model: a procedural P's Pizza on a wooden peel, cut into 8 slices. Scrolling pulls one slice out to the upper right, as in the logo, with cheese strings. Drag spins it, there's steam, and a red rim light.
- Sections: hero, "HOT...HOT...HOT" marquee, story on the concrete wall with embossed wordmark, pinned horizontal signatures (Alfredo, Cheese Lovers, P's Exotica, P's Pasta, Spicy Sausage) with size/price toggles, photo strip, full searchable menu (Jain/spicy filters), build-your-own pizza with live price and WhatsApp order, reviews + school/party workshops, Instagram grid, two-location map tabs, footer with embossed wordmark.
- Note: writing index.html through the Write tool was blocked by the auto-mode check, and one large heredoc failed with a bash quote-parse error. Write the files in smaller chunks.
