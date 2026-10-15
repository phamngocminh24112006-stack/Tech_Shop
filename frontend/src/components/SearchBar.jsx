import { useState } from "react";

function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    sortBy: ""
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      search: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: ""
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const categories = ["Laptop", "VGA", "CPU", "RAM", "SSD", "Mainboard", "Tản nhiệt"];
  const brands = ["ASUS", "NVIDIA", "MSI", "Intel", "AMD", "Gigabyte", "Kingston", "Corsair"];

  return (
    <div className="filter-sidebar mb-4">
      <form onSubmit={handleApplyFilters}>
        <div className="row g-3">
          {/* Keyword Search */}
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label text-white-50 small">Từ khóa</label>
            <input
              type="text"
              name="search"
              className="form-control"
              placeholder="Tên sản phẩm, mô tả..."
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label className="form-label text-white-50 small">Danh mục</label>
            <select
              name="category"
              className="form-select"
              value={filters.category}
              onChange={handleChange}
            >
              <option value="">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label className="form-label text-white-50 small">Thương hiệu</label>
            <select
              name="brand"
              className="form-select"
              value={filters.brand}
              onChange={handleChange}
            >
              <option value="">Tất cả</option>
              {brands.map((br) => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* Price Filters */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-3">
            <label className="form-label text-white-50 small">Khoảng giá (VND)</label>
            <div className="input-group">
              <input
                type="number"
                name="minPrice"
                className="form-control"
                placeholder="Từ"
                value={filters.minPrice}
                onChange={handleChange}
              />
              <span className="input-group-text bg-secondary text-white border-0">-</span>
              <input
                type="number"
                name="maxPrice"
                className="form-control"
                placeholder="Đến"
                value={filters.maxPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-2">
            <label className="form-label text-white-50 small">Sắp xếp theo</label>
            <select
              name="sortBy"
              className="form-select"
              value={filters.sortBy}
              onChange={handleChange}
            >
              <option value="">Mặc định</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="name_asc">Tên (A-Z)</option>
              <option value="name_desc">Tên (Z-A)</option>
              <option value="rating_desc">Đánh giá tốt nhất</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={handleResetFilters}
          >
            Mặc định
          </button>
          <button type="submit" className="btn btn-primary px-4">
            Áp dụng lọc
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
