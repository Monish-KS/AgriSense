import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is AgriSense?",
    answer: "AgriSense is an AI-Powered Agricultural Decision Support System designed to help Indian farmers optimize their farming practices using data and technology."
  },
  {
    question: "How can AgriSense help me?",
    answer: "AgriSense provides tools for soil analytics, weather forecasting, crop recommendations, water management, and supply chain integration to help you make informed decisions and improve productivity."
  },
  {
    question: "Is my data safe with AgriSense?",
    answer: "Yes, we prioritize the security and privacy of your data. We use industry-standard practices to protect your information."
  },
  {
    question: "How do I get started?",
    answer: "You can get started by signing up for an account and exploring the different features available on the dashboard."
  },
  {
    question: "Where can I find help if I have issues?",
    answer: "You can use this Help section for general questions, or contact our support team through the contact information provided in the Settings or About section (if available)."
  }
];

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-white bg-agrisense-primary hover:text-white hover:bg-green-900">Help</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={`faq-${index}`} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}