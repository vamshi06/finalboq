const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com").replace(/\/$/, "");
const response = await fetch(`${BACKEND}/api/boq/export/excel`);