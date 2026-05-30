import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function FaqTab() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<"p" | "r" | "s">("p");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderFaqItem = (id: string, qKey: string, aKey: string) => {
    const isExpanded = !!expandedItems[id];
    return (
      <div className="faq-item" key={id}>
        <div className="faq-item__question" onClick={() => toggleItem(id)} style={{ cursor: "pointer" }}>
          <span>{t(qKey)}</span>
          <span className="faq-item__icon">{isExpanded ? "−" : "+"}</span>
        </div>
        {isExpanded && (
          <div className="faq-item__answer" style={{ display: "block" }}>
            <span dangerouslySetInnerHTML={{ __html: t(aKey) }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tab tab--active">
      <div className="section-title">{t("faq_title")}</div>
      
      <div className="faq-categories">
        <button 
          className={`faq-categories__btn ${activeCategory === "p" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("p")}
        >
          {t("faq_btn_predictions")}
        </button>
        <button 
          className={`faq-categories__btn ${activeCategory === "r" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("r")}
        >
          {t("faq_btn_rules")}
        </button>
        <button 
          className={`faq-categories__btn ${activeCategory === "s" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("s")}
        >
          {t("faq_btn_security")}
        </button>
      </div>

      {activeCategory === "p" && (
        <div className="faq-section faq-section--active">
          {renderFaqItem("p1", "faq_p_q1", "faq_p_a1")}
          {renderFaqItem("p2", "faq_p_q2", "faq_p_a2")}
          {renderFaqItem("p3", "faq_p_q3", "faq_p_a3")}
          {renderFaqItem("p4", "faq_p_q4", "faq_p_a4")}
          {renderFaqItem("p5", "faq_p_q5", "faq_p_a5")}
          {renderFaqItem("p6", "faq_p_q6", "faq_p_a6")}
        </div>
      )}

      {activeCategory === "r" && (
        <div className="faq-section faq-section--active">
          {renderFaqItem("r1", "faq_r_q1", "faq_r_a1")}
          {renderFaqItem("r2", "faq_r_q2", "faq_r_a2")}
          {renderFaqItem("r3", "faq_r_q3", "faq_r_a3")}
          {renderFaqItem("r4", "faq_r_q4", "faq_r_a4")}
        </div>
      )}

      {activeCategory === "s" && (
        <div className="faq-section faq-section--active">
          {renderFaqItem("s1", "faq_s_q1", "faq_s_a1")}
          {renderFaqItem("s2", "faq_s_q2", "faq_s_a2")}
          {renderFaqItem("s3", "faq_s_q4", "faq_s_a4")}
        </div>
      )}
    </div>
  );
}
