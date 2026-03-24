const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Brand colors (converted from hex to 0-1 range)
const COLORS = {
  cream:      rgb(253/255, 246/255, 238/255),
  sienna:     rgb(199/255, 91/255, 57/255),
  sundayBrown:rgb(107/255, 76/255, 59/255),
  castIron:   rgb(61/255, 48/255, 41/255),
  honeyGold:  rgb(212/255, 164/255, 76/255),
  herbGreen:  rgb(91/255, 123/255, 90/255),
  stoneGray:  rgb(155/255, 142/255, 130/255),
  white:      rgb(1, 1, 1),
  lightCream: rgb(250/255, 243/255, 232/255),
};

const PAGE_W = 612; // Letter size
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - 2 * MARGIN;

async function main() {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Helper: draw cream background on a page
  function drawBackground(page) {
    page.drawRectangle({
      x: 0, y: 0, width: PAGE_W, height: PAGE_H,
      color: COLORS.cream,
    });
  }

  // Helper: draw a decorative horizontal line
  function drawAccentLine(page, y, color = COLORS.sienna, width = CONTENT_W) {
    const x = (PAGE_W - width) / 2;
    page.drawRectangle({ x, y, width, height: 2, color });
  }

  // Helper: draw a checkbox square
  function drawCheckbox(page, x, y, size = 11, color = COLORS.sienna) {
    page.drawRectangle({ x, y: y - 1, width: size, height: size, borderColor: color, borderWidth: 1.2, color: COLORS.cream });
  }

  // Helper: draw a star outline (using a simple circle as stand-in)
  function drawStar(page, x, y, color = COLORS.honeyGold) {
    page.drawCircle({ x: x + 8, y: y + 4, size: 8, borderColor: color, borderWidth: 1.5, color: COLORS.cream });
  }

  // Helper: draw a thin divider
  function drawThinLine(page, y, color = COLORS.stoneGray) {
    const x = MARGIN;
    page.drawRectangle({ x, y, width: CONTENT_W, height: 0.5, color });
  }

  // Helper: wrap text into lines that fit a given width
  function wrapText(text, font, size, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // Helper: draw wrapped text, returns new Y position
  function drawWrapped(page, text, x, y, font, size, color, maxWidth, lineHeight) {
    const lh = lineHeight || size * 1.5;
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      if (y < MARGIN + 20) {
        // We'd need a new page — for this doc we plan carefully so this shouldn't happen
        break;
      }
      page.drawText(line, { x, y, size, font, color });
      y -= lh;
    }
    return y;
  }

  // Helper: draw centered text
  function drawCentered(page, text, y, font, size, color) {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color });
  }

  // Helper: draw a rounded-ish rectangle (pdf-lib doesn't do rounded corners natively, so just a rect)
  function drawBox(page, x, y, w, h, color, borderColor) {
    if (borderColor) {
      page.drawRectangle({ x: x - 1, y: y - 1, width: w + 2, height: h + 2, color: borderColor });
    }
    page.drawRectangle({ x, y, width: w, height: h, color });
  }

  // ========== PAGE 1: WELCOME COVER ==========
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawBackground(page);

    // Top decorative bar
    page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: COLORS.sienna });

    // Decorative accent line near top
    let y = PAGE_H - 60;
    drawAccentLine(page, y, COLORS.honeyGold, 120);

    // Title
    y -= 60;
    drawCentered(page, 'Sunday Dinner', y, bold, 36, COLORS.castIron);
    y -= 44;
    drawCentered(page, 'Memories', y, bold, 36, COLORS.castIron);

    y -= 40;
    drawAccentLine(page, y, COLORS.sienna, 200);

    // Subtitle
    y -= 40;
    drawCentered(page, 'Beta Tester Guide', y, bold, 22, COLORS.sienna);

    // Decorative divider
    y -= 30;
    drawAccentLine(page, y, COLORS.honeyGold, 80);

    // Welcome message box
    y -= 60;
    const boxH = 130;
    const boxW = CONTENT_W - 40;
    const boxX = (PAGE_W - boxW) / 2;
    drawBox(page, boxX, y - boxH + 20, boxW, boxH, COLORS.lightCream, COLORS.honeyGold);

    let textY = y + 10;
    const welcomeText = "Welcome to the family! You're one of the first people to try Sunday Dinner Memories \u2014 an app that turns your family's recipe cards into a digital collection everyone can share.";
    textY = drawWrapped(page, welcomeText, boxX + 16, textY, helvetica, 13, COLORS.sundayBrown, boxW - 32, 20);

    textY -= 8;
    const thankText = "Thank you for helping us make this amazing. Your feedback matters!";
    drawWrapped(page, thankText, boxX + 16, textY, bold, 13, COLORS.sienna, boxW - 32, 20);

    // Bottom decorative elements
    y = 100;
    drawAccentLine(page, y, COLORS.herbGreen, 60);
    y -= 25;
    drawCentered(page, 'Made with love for families who cook together.', y, oblique, 11, COLORS.stoneGray);

    // Bottom bar
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 8, color: COLORS.sienna });
  }

  // ========== PAGE 2: GETTING STARTED ==========
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawBackground(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.sienna });

    let y = PAGE_H - 50;
    drawCentered(page, 'Getting Started', y, bold, 26, COLORS.castIron);
    y -= 14;
    drawAccentLine(page, y, COLORS.sienna, 160);
    y -= 10;
    drawCentered(page, "Three simple steps and you're in!", y, oblique, 12, COLORS.stoneGray);

    // Step 1
    y -= 50;
    const stepBoxW = CONTENT_W;
    const stepBoxX = MARGIN;

    function drawStep(page, stepNum, title, instructions, tip, startY) {
      let sy = startY;

      // Step number circle (drawn as a small filled rect with number)
      const circleSize = 28;
      page.drawCircle({ x: stepBoxX + 16, y: sy - 2, size: 14, color: COLORS.sienna });
      const numW = bold.widthOfTextAtSize(String(stepNum), 14);
      page.drawText(String(stepNum), { x: stepBoxX + 16 - numW/2, y: sy - 7, size: 14, font: bold, color: COLORS.white });

      // Title
      page.drawText(title, { x: stepBoxX + 40, y: sy - 6, size: 16, font: bold, color: COLORS.castIron });
      sy -= 30;

      // Instructions
      for (const line of instructions) {
        const bullet = '\u2022 ' + line;
        sy = drawWrapped(page, bullet, stepBoxX + 20, sy, helvetica, 12, COLORS.sundayBrown, stepBoxW - 40, 18);
        sy -= 2;
      }

      // Tip
      if (tip) {
        sy -= 6;
        const tipBox_w = stepBoxW - 40;
        drawBox(page, stepBoxX + 16, sy - 18, tipBox_w, 26, COLORS.lightCream);
        page.drawText('> Tip: ', { x: stepBoxX + 24, y: sy - 12, size: 11, font: bold, color: COLORS.honeyGold });
        const tipTextX = stepBoxX + 24 + bold.widthOfTextAtSize('> Tip: ', 11);
        drawWrapped(page, tip, tipTextX, sy - 12, oblique, 11, COLORS.sundayBrown, tipBox_w - (tipTextX - stepBoxX - 16) - 8, 16);
        sy -= 30;
      }

      sy -= 10;
      drawThinLine(page, sy, COLORS.stoneGray);
      sy -= 10;
      return sy;
    }

    y = drawStep(page, 1, 'Open the App', [
      'On your phone, open your web browser (Safari or Chrome)',
      'Go to: sundaydinnermemories.com',
    ], 'Bookmark it or add it to your home screen so you can find it easily!', y);

    y = drawStep(page, 2, 'Create Your Account', [
      'Tap "Sign Up"',
      'Enter your email and pick a password',
      "That's it \u2014 you're in!",
    ], null, y);

    y = drawStep(page, 3, 'Create Your Family', [
      'After signing up, tap "Create a Family"',
      'Give your family a name (like "The Smith Family")',
      "You'll get a family code \u2014 share this with anyone you want to invite!",
    ], null, y);

    // Footer
    y -= 20;
    drawBox(page, MARGIN, y - 50, CONTENT_W, 55, COLORS.lightCream, COLORS.herbGreen);
    drawWrapped(page, "That's all the setup! Now let's try out the features. On the next pages, you'll find a checklist of things to try. Work through them at your own pace \u2014 no rush!", MARGIN + 14, y - 8, helvetica, 12, COLORS.sundayBrown, CONTENT_W - 28, 18);

    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.sienna });
  }

  // ========== PAGES 3-4: FEATURE CHECKLIST ==========
  const checklistItems = [
    {
      title: 'Scan a Recipe Card',
      how: 'Tap "Import Recipe" > "Scan Recipe Card" > Point your camera at a recipe card > Tap the capture button > Review what the AI found > Save',
      tips: 'Good lighting helps! Lay the card flat. Hold your phone steady.',
    },
    {
      title: 'Upload a Photo of a Recipe',
      how: 'Tap "Import Recipe" > "Upload Photo" > Pick a photo from your camera roll > Review > Save',
    },
    {
      title: 'Type In a Recipe By Hand',
      how: 'Tap "Import Recipe" > "Enter Manually" > Fill in the recipe details > Save',
    },
    {
      title: 'Import from a Website',
      how: 'Tap "Import Recipe" > "Paste URL" > Paste a recipe link from any cooking website > Import',
    },
    {
      title: 'Browse Your Recipes',
      how: 'From the main screen, scroll through your recipes. Try tapping on one to see the full recipe.',
    },
    {
      title: 'Search for a Recipe',
      how: 'Use the search bar at the top. Try searching by ingredient ("chicken") or recipe name.',
    },
    {
      title: 'Favorite a Recipe',
      how: 'Tap the heart icon on any recipe card or recipe page.',
    },
    {
      title: 'Scale a Recipe (Change Servings)',
      how: 'Open any recipe > Find the servings buttons (\u00bd\u00d7, 1\u00d7, 2\u00d7, 3\u00d7) > Watch the ingredient amounts change!',
    },
    {
      title: 'Download a Recipe as PDF',
      how: 'Open any recipe > Tap "Download PDF" > A nice PDF saves to your phone',
    },
    {
      title: 'Create a Cookbook',
      how: 'From the menu, go to "Cookbooks" > "Create Cookbook" > Name it > Add recipes to it',
    },
    {
      title: 'Add a Story to a Recipe',
      how: 'Open a recipe you added > Tap "Add Story" > Write about the memory behind this recipe > Save',
    },
    {
      title: 'Share a Recipe Publicly',
      how: 'Open a recipe > Toggle "Make Public" > Copy the link > Share it with anyone!',
    },
    {
      title: 'Plan a Meal',
      how: 'Go to "Meal Plan" > Create a new plan > Drag recipes onto different days',
    },
    {
      title: 'Generate a Shopping List',
      how: 'After planning meals > Tap "Generate Shopping List" > See all ingredients organized by aisle',
    },
    {
      title: 'Invite a Family Member',
      how: 'Go to "Family Settings" > Share your family code or invite link with someone',
    },
  ];

  // Split checklist across two pages
  const splitAt = 8;
  const checklistPages = [
    checklistItems.slice(0, splitAt),
    checklistItems.slice(splitAt),
  ];

  for (let pi = 0; pi < checklistPages.length; pi++) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawBackground(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.sienna });

    let y = PAGE_H - 50;
    if (pi === 0) {
      drawCentered(page, 'Feature Checklist', y, bold, 26, COLORS.castIron);
      y -= 14;
      drawAccentLine(page, y, COLORS.sienna, 160);
      y -= 10;
      drawCentered(page, 'Try each one and jot down your thoughts!', y, oblique, 12, COLORS.stoneGray);
      y -= 35;
    } else {
      drawCentered(page, 'Feature Checklist (continued)', y, bold, 22, COLORS.castIron);
      y -= 14;
      drawAccentLine(page, y, COLORS.sienna, 200);
      y -= 35;
    }

    const items = checklistPages[pi];
    for (const item of items) {
      // Checkbox + title
      // Draw checkbox square manually
      page.drawRectangle({ x: MARGIN, y: y - 2, width: 12, height: 12, borderColor: COLORS.sienna, borderWidth: 1.2, color: COLORS.cream });
      page.drawText(item.title, { x: MARGIN + 22, y: y, size: 13, font: bold, color: COLORS.castIron });
      y -= 20;

      // How
      const howLabel = 'How: ';
      page.drawText(howLabel, { x: MARGIN + 22, y: y, size: 10.5, font: bold, color: COLORS.sundayBrown });
      const howLabelW = bold.widthOfTextAtSize(howLabel, 10.5);
      y = drawWrapped(page, item.how, MARGIN + 22 + howLabelW, y, helvetica, 10.5, COLORS.sundayBrown, CONTENT_W - 44 - howLabelW, 15);

      // Tips (if any)
      if (item.tips) {
        y -= 2;
        page.drawText('Tips: ', { x: MARGIN + 22, y: y, size: 10.5, font: bold, color: COLORS.herbGreen });
        const tipsLabelW = bold.widthOfTextAtSize('Tips: ', 10.5);
        y = drawWrapped(page, item.tips, MARGIN + 22 + tipsLabelW, y, oblique, 10.5, COLORS.herbGreen, CONTENT_W - 44 - tipsLabelW, 15);
      }

      // Notes line
      y -= 2;
      page.drawText('Notes:', { x: MARGIN + 22, y: y, size: 10, font: bold, color: COLORS.stoneGray });
      const notesLabelW = bold.widthOfTextAtSize('Notes: ', 10);
      page.drawRectangle({ x: MARGIN + 22 + notesLabelW + 4, y: y - 2, width: CONTENT_W - 44 - notesLabelW - 4, height: 0.5, color: COLORS.stoneGray });
      y -= 22;

      // Divider between items
      drawThinLine(page, y + 8, rgb(230/255, 220/255, 210/255));
      y -= 8;
    }

    // Page number
    const pageNum = String(pi + 3);
    const pnW = helvetica.widthOfTextAtSize(pageNum, 10);
    page.drawText(pageNum, { x: (PAGE_W - pnW) / 2, y: 20, size: 10, font: helvetica, color: COLORS.stoneGray });
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.sienna });
  }

  // ========== PAGE 5: RECIPE CARD SCANNING TIPS ==========
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawBackground(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.sienna });

    let y = PAGE_H - 50;
    drawCentered(page, 'Recipe Card Scanning Tips', y, bold, 26, COLORS.castIron);
    y -= 14;
    drawAccentLine(page, y, COLORS.sienna, 200);
    y -= 10;
    drawCentered(page, 'A few tricks to get the best results!', y, oblique, 12, COLORS.stoneGray);

    // Best results section
    y -= 45;
    page.drawText('For the best scan results:', { x: MARGIN, y, size: 15, font: bold, color: COLORS.castIron });
    y -= 28;

    const bestTips = [
      ['Good lighting', 'natural light or a bright room works best'],
      ['Flat surface', 'lay the card on a table, don\'t hold it in the air'],
      ['Hold steady', 'keep your phone still while it captures'],
      ['Full card visible', 'make sure the whole card is in the frame'],
      ['Clear text', 'if the handwriting is hard to read, the AI might struggle too'],
    ];

    for (const [label, desc] of bestTips) {
      // Draw a checkmark manually
      page.drawLine({ start: { x: MARGIN + 8, y: y + 3 }, end: { x: MARGIN + 12, y: y - 1 }, thickness: 2, color: COLORS.herbGreen });
      page.drawLine({ start: { x: MARGIN + 12, y: y - 1 }, end: { x: MARGIN + 20, y: y + 8 }, thickness: 2, color: COLORS.herbGreen });
      page.drawText(label, { x: MARGIN + 28, y, size: 12, font: bold, color: COLORS.sundayBrown });
      const labelW = bold.widthOfTextAtSize(label, 12);
      page.drawText(' \u2014 ' + desc, { x: MARGIN + 28 + labelW, y, size: 12, font: helvetica, color: COLORS.sundayBrown });
      y -= 24;
    }

    // Types of cards
    y -= 20;
    page.drawText('Types of cards to try:', { x: MARGIN, y, size: 15, font: bold, color: COLORS.castIron });
    y -= 28;

    const cardTypes = [
      'Handwritten recipe cards (index cards)',
      'Printed recipes from magazines or books',
      'Recipes written in notebooks',
      'Old, faded, or stained cards (the AI handles these surprisingly well!)',
    ];

    for (const ct of cardTypes) {
      page.drawText('\u2022', { x: MARGIN + 8, y, size: 12, font: bold, color: COLORS.honeyGold });
      y = drawWrapped(page, ct, MARGIN + 28, y, helvetica, 12, COLORS.sundayBrown, CONTENT_W - 40, 18);
      y -= 6;
    }

    // If scan isn't perfect
    y -= 20;
    page.drawText("If a scan isn't perfect:", { x: MARGIN, y, size: 15, font: bold, color: COLORS.castIron });
    y -= 28;

    const imperfectTips = [
      "Don't worry! You can edit any field after scanning.",
      "The AI gets most things right, but you might need to fix a word or two.",
      "That's exactly the kind of feedback we need \u2014 tell us what it got wrong!",
    ];

    for (const tip of imperfectTips) {
      page.drawText('\u2022', { x: MARGIN + 8, y, size: 12, font: bold, color: COLORS.sienna });
      y = drawWrapped(page, tip, MARGIN + 28, y, helvetica, 12, COLORS.sundayBrown, CONTENT_W - 40, 18);
      y -= 6;
    }

    // Encouraging box at bottom
    y -= 20;
    drawBox(page, MARGIN, y - 45, CONTENT_W, 50, COLORS.lightCream, COLORS.honeyGold);
    drawWrapped(page, "Remember: there's no wrong way to do this. Just try things out and let us know what happens. We're building this for families like yours!", MARGIN + 14, y - 10, oblique, 12, COLORS.sundayBrown, CONTENT_W - 28, 17);

    page.drawText('5', { x: (PAGE_W - helvetica.widthOfTextAtSize('5', 10)) / 2, y: 20, size: 10, font: helvetica, color: COLORS.stoneGray });
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.sienna });
  }

  // ========== PAGE 6: FEEDBACK ==========
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    drawBackground(page);
    page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLORS.sienna });

    let y = PAGE_H - 50;
    drawCentered(page, 'Tell Us What You Think!', y, bold, 26, COLORS.castIron);
    y -= 14;
    drawAccentLine(page, y, COLORS.sienna, 200);
    y -= 10;
    drawCentered(page, 'After trying each feature, we\'d love to know:', y, oblique, 12, COLORS.stoneGray);

    // Star rating
    y -= 40;
    page.drawText('Rate your overall experience:', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 22;
    // Draw 5 star outlines (circles)
    for (let i = 0; i < 5; i++) {
      const sx = MARGIN + 20 + i * 45;
      drawStar(page, sx, y, COLORS.honeyGold);
      page.drawText(String(i + 1), { x: sx + 5, y: y - 16, size: 9, font: helvetica, color: COLORS.stoneGray });
    }

    // Open questions
    y -= 50;
    page.drawText('What was your favorite feature?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 18;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 0.5, color: COLORS.stoneGray });
    y -= 18;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 0.5, color: COLORS.stoneGray });

    y -= 28;
    page.drawText('What was confusing or didn\'t work?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 18;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 0.5, color: COLORS.stoneGray });
    y -= 18;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 0.5, color: COLORS.stoneGray });

    // Card types checkboxes
    y -= 28;
    page.drawText('What type of recipe cards did you scan?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 22;
    const cardCheckboxes = ['Handwritten index cards', 'Printed/typed cards', 'Magazine clippings', 'Notebook pages', 'Old/faded cards', 'Other: ___________'];
    // Two columns
    for (let i = 0; i < cardCheckboxes.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = MARGIN + col * (CONTENT_W / 2);
      const cy = y - row * 20;
      drawCheckbox(page, cx, cy, 10, COLORS.sienna);
      page.drawText(cardCheckboxes[i], { x: cx + 18, y: cy, size: 11, font: helvetica, color: COLORS.sundayBrown });
    }
    y -= Math.ceil(cardCheckboxes.length / 2) * 20 + 10;

    // Accuracy
    y -= 10;
    page.drawText('How accurate was the scanning?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 22;
    const accuracyOpts = [
      'Perfect \u2014 got everything right',
      'Pretty good \u2014 just a few small errors',
      'OK \u2014 had to fix several things',
      'Not great \u2014 got a lot wrong',
    ];
    for (const opt of accuracyOpts) {
      drawCheckbox(page, MARGIN + 8, y, 10, COLORS.sienna);
      page.drawText(opt, { x: MARGIN + 26, y, size: 11, font: helvetica, color: COLORS.sundayBrown });
      y -= 20;
    }

    // Would you use
    y -= 10;
    page.drawText('Would you use this app regularly?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 22;
    const useOpts = ['Absolutely!', 'Probably', 'Maybe', 'Probably not'];
    for (let i = 0; i < useOpts.length; i++) {
      const cx = MARGIN + 8 + (i % 2) * (CONTENT_W / 2);
      const cy = y - Math.floor(i / 2) * 20;
      drawCheckbox(page, cx, cy, 10, COLORS.sienna);
      page.drawText(useOpts[i], { x: cx + 18, y: cy, size: 11, font: helvetica, color: COLORS.sundayBrown });
    }
    y -= Math.ceil(useOpts.length / 2) * 20 + 10;

    // Anything else
    y -= 10;
    page.drawText('Anything else you want to tell us?', { x: MARGIN, y, size: 13, font: bold, color: COLORS.castIron });
    y -= 18;
    for (let i = 0; i < 3; i++) {
      page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 0.5, color: COLORS.stoneGray });
      y -= 18;
    }

    // Contact box
    y -= 15;
    drawBox(page, MARGIN, y - 42, CONTENT_W, 48, COLORS.lightCream, COLORS.sienna);
    drawCentered(page, 'Send your feedback to Zach!', y - 10, bold, 14, COLORS.sienna);
    drawCentered(page, '(Just text me or grab me at work \u2014 I want to hear everything!)', y - 30, oblique, 12, COLORS.sundayBrown);

    page.drawText('6', { x: (PAGE_W - helvetica.widthOfTextAtSize('6', 10)) / 2, y: 20, size: 10, font: helvetica, color: COLORS.stoneGray });
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.sienna });
  }

  // Save
  const pdfBytes = await doc.save();
  const outPath = path.resolve('C:/Users/Zach/Desktop/Sunday-Dinner-Memories-Beta-Guide.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log('PDF created: ' + outPath);
  console.log('Pages: ' + doc.getPageCount());
  console.log('Size: ' + (pdfBytes.length / 1024).toFixed(1) + ' KB');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
