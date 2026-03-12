import { Router } from "express";
import { loadRateCard, searchRateCard } from "../services/rateCard.service";
import { fuzzySearchRateCard } from "../services/rateCardMapping.service";

const router = Router();

// Get all rate card items
router.get("/", (req, res) => {
  try {
    const items = loadRateCard();
    res.json(items);
  } catch (error) {
    console.error("Error loading rate card:", error);
    res.status(500).json({ error: "Failed to load rate card" });
  }
});

// Search rate card by keyword (supports ?q= or ?keyword=)
router.get("/search", (req, res) => {
  try {
    const { keyword, q, dept, limit } = req.query;
    const searchKeyword = ((keyword as string) || (q as string) || "").trim();
    const searchDept = (dept as string) || undefined;
    const searchLimit = parseInt((limit as string) || "10");

    const results = searchKeyword
      ? fuzzySearchRateCard(searchKeyword, searchDept || undefined, searchLimit)
      : loadRateCard().slice(0, searchLimit);
    res.json(results);
  } catch (error) {
    console.error("Error searching rate card:", error);
    res.status(500).json({ error: "Failed to search rate card" });
  }
});

// Get items by department/category
router.get("/dept/:deptName", (req, res) => {
  try {
    const { deptName } = req.params;
    const items = loadRateCard();
    const filtered = items.filter((item) =>
      item.dept.toLowerCase().includes(deptName.toLowerCase())
    );
    res.json(filtered);
  } catch (error) {
    console.error("Error loading department items:", error);
    res.status(500).json({ error: "Failed to load department items" });
  }
});

export default router;
