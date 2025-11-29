'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const faqs = [
  {
    question: "What is CYCLR and how does it work?",
    answer: "CYCLR is a blockchain-powered platform that tracks products throughout their entire lifecycle. Every product gets a unique digital passport that records manufacturing, ownership transfers, and end-of-life recycling. Users earn tokens for sustainable actions like returning products for recycling."
  },
  {
    question: "How do I earn rewards?",
    answer: "You earn CYCLR tokens by scanning and registering products, returning items for recycling through our partner network, staking your tokens, and referring new users. The more sustainable actions you take, the more you earn."
  },
  {
    question: "Is my data secure on the blockchain?",
    answer: "Yes, your data is cryptographically secured on the blockchain. Only you control access to your personal information. Product lifecycle data is transparent for verification, but personal details remain private."
  },
  {
    question: "Which brands are participating?",
    answer: "We partner with over 340 brands across electronics, fashion, and consumer goods. Major partners include leading sustainable brands committed to circular economy principles. Check our partner page for the full list."
  },
  {
    question: "How can my company join CYCLR?",
    answer: "Brands can integrate CYCLR through our API and SDK. We offer enterprise solutions for product registration, lifecycle tracking, and customer engagement. Contact our partnership team to get started."
  },
];

export default function FAQSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-chlorophyll text-sm font-medium tracking-widest uppercase mb-4 block">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-holographic">
            Common Questions
          </h2>
        </motion.div>
        
        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="glass-panel rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                data-cursor="button"
              >
                <span className="text-lg font-medium text-holographic pr-8">
                  {faq.question}
                </span>
                <motion.span
                  className="text-chlorophyll shrink-0"
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </motion.span>
              </button>
              
              <motion.div
                className="overflow-hidden"
                initial={false}
                animate={{
                  height: openIndex === i ? 'auto' : 0,
                  opacity: openIndex === i ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="px-6 pb-5 text-holographic-muted leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
