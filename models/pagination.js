function get({ total_rows, page, per_page, strategy }) {
  const firstPage = 1;
  const lastPage = Math.ceil(total_rows / per_page) || 1;
  const nextPage = page >= lastPage ? null : page + 1;
  const previousPage = page <= 1 ? null : page > lastPage ? lastPage : page - 1;

  const pagination = {
    currentPage: page,
    totalRows: total_rows,
    perPage: per_page,
    firstPage: firstPage,
    nextPage: nextPage,
    previousPage: previousPage,
    lastPage: lastPage,
  };

  if (strategy) {
    pagination.strategy = strategy;
  }

  return pagination;
}

export default Object.freeze({
  get,
});
