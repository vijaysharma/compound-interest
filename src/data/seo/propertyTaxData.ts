export const PROPERTY_TAX_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Property Capital Gains Tax Calculator India — Old vs New Rule (Indexation vs 12.5%)',
      description: 'Calculate real estate long-term capital gains tax under the Finance Act 2024 grandfathering amendment. Compare 20% with Cost Inflation Index (CII) indexation against 12.5% flat tax with Section 54 & 54EC exemptions.',
      category: 'TaxCalculator',
      provider: { '@type': 'Organization', name: 'Rupee Calculator', url: 'https://rupees.vercel.app/' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the new capital gains tax rule on property in Budget 2024?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Budget 2024 reduced the Long-Term Capital Gains (LTCG) tax rate on real estate from 20% to 12.5% and initially removed the indexation benefit. However, the Finance Bill amendment introduced a grandfathering clause: for properties acquired before July 23, 2024, resident individuals and HUFs can compute tax under both the Old Rule (20% with indexation) and New Rule (12.5% without indexation) and pay whichever is lower.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is indexation benefit calculated for property sales?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Indexed Cost of Acquisition is calculated as: Purchase Price × (CII of Sale Year / CII of Purchase Year). Cost Inflation Index (CII) is notified annually by the Central Board of Direct Taxes (CBDT) with 2001-02 as the base year (100).',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the holding period for Long-Term Capital Gains (LTCG) on immovable property?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For immovable property (land, house, apartment, commercial property), the holding period threshold for long-term capital assets is 24 months (2 years). If sold within 24 months, gains are treated as Short-Term Capital Gains (STCG) and taxed at applicable income tax slab rates.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can I save capital gains tax under Section 54 and Section 54EC?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under Section 54, LTCG from a residential house can be exempted if reinvested in buying or constructing another residential house in India within specified time limits (subject to a maximum cap of ₹10 Crores). Under Section 54EC, LTCG can be exempted by investing in specified capital gains bonds (REC, PFC, NHAI, IRFC) within 6 months of transfer, capped at ₹50 Lakhs per financial year.',
          },
        },
      ],
    },
  ],
};
export const PROPERTY_TAX_FAQS = [
  {
    question: 'What is the grandfathering clause introduced in Budget 2024?',
    answer: 'In the Union Budget 2024 presented on July 23, 2024, the government initially proposed replacing the 20% LTCG with indexation with a flat 12.5% rate without indexation for all property sales. Following representations from homeowners, an official amendment was enacted in the Finance (No. 2) Act 2024: for immovable property acquired prior to July 23, 2024, resident individuals and Hindu Undivided Families (HUFs) have the legal option to calculate tax under both methods and pay the lower amount.',
  },
  {
    question: 'When is the Old Rule (20% with Indexation) better than the New Rule (12.5%)?',
    answer: 'The Old Rule is typically better when the property was purchased many years ago (high accumulated inflation) or when price appreciation was moderate (e.g. 5% to 8% per annum). In such cases, indexation significantly inflates the purchase cost, drastically reducing taxable gains or even creating a paper loss. Conversely, if the property appreciated rapidly (e.g. 15%+ per annum), the lower flat 12.5% tax rate usually saves more money.',
  },
  {
    question: 'What is the holding period required for Long-Term Capital Gains (LTCG)?',
    answer: 'For immovable property (land, residential flat, commercial office, villa), the statutory holding period to qualify as a long-term capital asset is more than 24 months (2 years) from the date of purchase or registration. If sold within 24 months, it is treated as Short-Term Capital Gains (STCG) and added to your income, taxable at your regular slab rate (plus 4% cess).',
  },
  {
    question: 'How does Section 54 exemption work for residential house property?',
    answer: 'Under Section 54, if you sell a long-term residential house and reinvest the capital gains in purchasing or constructing a new residential property in India, the capital gain is exempt from tax. The new house must be purchased within 1 year before or 2 years after the date of sale, or constructed within 3 years. The Finance Act 2023 capped Section 54 exemption at ₹10 Crores.',
  },
  {
    question: 'What are Section 54EC capital gains bonds?',
    answer: 'Section 54EC allows taxpayers to exempt long-term capital gains from real estate by investing up to ₹50 Lakhs in specified bonds issued by REC, PFC, NHAI, or IRFC. The investment must be made within 6 months of property transfer. The bonds have a lock-in period of 5 years and provide an annual taxable interest rate.',
  },
  {
    question: 'Can I claim indexation if the property was acquired on or after 23 July 2024?',
    answer: 'No. For any immovable property acquired on or after July 23, 2024, indexation benefit is permanently abolished. If held for more than 24 months, the gain is taxed at a flat 12.5% (plus 4% cess, total 13.0%) without cost indexation.',
  },
];
