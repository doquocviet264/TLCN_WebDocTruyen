function parsePaging(q) {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { parsePaging, buildMeta };