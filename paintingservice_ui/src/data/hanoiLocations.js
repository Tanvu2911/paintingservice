// Danh mục đầy đủ 30 Quận / Huyện / Thị xã và Phường / Xã / Thị trấn trực thuộc Thành phố Hà Nội
export const HANOI_CENTER = [21.028511, 105.854167]; // Hồ Hoàn Kiếm, Hà Nội [lat, lng]
export const HANOI_CENTER_LNG_LAT = [105.854167, 21.028511]; // [lng, lat] cho Mapbox

export const MAPBOX_PUBLIC_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || "";


export const HANOI_DISTRICTS = [
  {
    name: "Quận Ba Đình",
    lat: 21.0341,
    lng: 105.8239,
    wards: [
      "Phường Cống Vị",
      "Phường Điện Biên",
      "Phường Đội Cấn",
      "Phường Giảng Võ",
      "Phường Kim Mã",
      "Phường Liễu Giai",
      "Phường Ngọc Hà",
      "Phường Ngọc Khánh",
      "Phường Nguyễn Trung Trực",
      "Phường Phúc Xá",
      "Phường Quán Thánh",
      "Phường Thành Công",
      "Phường Trúc Bạch",
      "Phường Vĩnh Phúc",
    ],
  },
  {
    name: "Quận Cầu Giấy",
    lat: 21.0366,
    lng: 105.782,
    wards: [
      "Phường Dịch Vọng",
      "Phường Dịch Vọng Hậu",
      "Phường Mai Dịch",
      "Phường Nghĩa Đô",
      "Phường Nghĩa Tân",
      "Phường Quan Hoa",
      "Phường Trung Hòa",
      "Phường Yên Hòa",
    ],
  },
  {
    name: "Quận Đống Đa",
    lat: 21.0181,
    lng: 105.8266,
    wards: [
      "Phường Cát Linh",
      "Phường Hàng Bột",
      "Phường Khâm Thiên",
      "Phường Khương Thượng",
      "Phường Kim Liên",
      "Phường Láng Hạ",
      "Phường Láng Thượng",
      "Phường Nam Đồng",
      "Phường Ngã Tư Sở",
      "Phường Ô Chợ Dừa",
      "Phường Phương Liên",
      "Phường Phương Mai",
      "Phường Quang Trung",
      "Phường Quốc Tử Giám",
      "Phường Thịnh Quang",
      "Phường Thổ Quan",
      "Phường Trung Liệt",
      "Phường Trung Phụng",
      "Phường Trung Tự",
      "Phường Văn Chương",
      "Phường Văn Miếu",
    ],
  },
  {
    name: "Quận Hai Bà Trưng",
    lat: 21.0069,
    lng: 105.8524,
    wards: [
      "Phường Bách Khoa",
      "Phường Bạch Đằng",
      "Phường Bạch Mai",
      "Phường Cầu Dền",
      "Phường Đống Mác",
      "Phường Đồng Nhân",
      "Phường Đồng Tâm",
      "Phường Lê Đại Hành",
      "Phường Minh Khai",
      "Phường Nguyễn Du",
      "Phường Phạm Đình Hổ",
      "Phường Phố Huế",
      "Phường Quỳnh Lôi",
      "Phường Quỳnh Mai",
      "Phường Thanh Lương",
      "Phường Thanh Nhàn",
      "Phường Trương Định",
      "Phường Vĩnh Tuy",
    ],
  },
  {
    name: "Quận Hoàn Kiếm",
    lat: 21.0285,
    lng: 105.8542,
    wards: [
      "Phường Chương Dương",
      "Phường Cửa Đông",
      "Phường Cửa Nam",
      "Phường Đồng Xuân",
      "Phường Hàng Bạc",
      "Phường Hàng Bài",
      "Phường Hàng Bồ",
      "Phường Hàng Bông",
      "Phường Hàng Buồm",
      "Phường Hàng Đào",
      "Phường Hàng Gai",
      "Phường Hàng Mã",
      "Phường Hàng Trống",
      "Phường Lý Thái Tổ",
      "Phường Phan Chu Trinh",
      "Phường Phúc Tân",
      "Phường Tràng Tiền",
      "Phường Trần Hưng Đạo",
    ],
  },
  {
    name: "Quận Thanh Xuân",
    lat: 20.9937,
    lng: 105.8122,
    wards: [
      "Phường Hạ Đình",
      "Phường Khương Đình",
      "Phường Khương Mai",
      "Phường Khương Trung",
      "Phường Kim Giang",
      "Phường Nhân Chính",
      "Phường Phương Liệt",
      "Phường Thanh Xuân Bắc",
      "Phường Thanh Xuân Nam",
      "Phường Thanh Xuân Trung",
      "Phường Thượng Đình",
    ],
  },
  {
    name: "Quận Nam Từ Liêm",
    lat: 21.0142,
    lng: 105.7654,
    wards: [
      "Phường Cầu Diễn",
      "Phường Đại Mỗ",
      "Phường Mễ Trì",
      "Phường Mỹ Đình 1",
      "Phường Mỹ Đình 2",
      "Phường Phú Đô",
      "Phường Phương Canh",
      "Phường Tây Mỗ",
      "Phường Trung Văn",
      "Phường Xuân Phương",
    ],
  },
  {
    name: "Quận Bắc Từ Liêm",
    lat: 21.0631,
    lng: 105.7618,
    wards: [
      "Phường Cổ Nhuế 1",
      "Phường Cổ Nhuế 2",
      "Phường Đông Ngạc",
      "Phường Đức Thắng",
      "Phường Liên Mạc",
      "Phường Minh Khai",
      "Phường Phú Diễn",
      "Phường Phúc Diễn",
      "Phường Tây Tựu",
      "Phường Thụy Phương",
      "Phường Thượng Cát",
      "Phường Xuân Đỉnh",
      "Phường Xuân Tảo",
    ],
  },
  {
    name: "Quận Hà Đông",
    lat: 20.9719,
    lng: 105.7766,
    wards: [
      "Phường Biên Giang",
      "Phường Đồng Mai",
      "Phường Dương Nội",
      "Phường Hà Cầu",
      "Phường Kiến Hưng",
      "Phường La Khê",
      "Phường Mộ Lao",
      "Phường Nguyễn Trãi",
      "Phường Phú La",
      "Phường Phú Lãm",
      "Phường Phú Lương",
      "Phường Phúc La",
      "Phường Quang Trung",
      "Phường Vạn Phúc",
      "Phường Văn Quán",
      "Phường Yên Nghĩa",
      "Phường Yết Kiêu",
    ],
  },
  {
    name: "Quận Hoàng Mai",
    lat: 20.9749,
    lng: 105.8569,
    wards: [
      "Phường Đại Kim",
      "Phường Định Công",
      "Phường Giáp Bát",
      "Phường Hoàng Liệt",
      "Phường Hoàng Văn Thụ",
      "Phường Lĩnh Nam",
      "Phường Mai Động",
      "Phường Tân Mai",
      "Phường Thanh Trì",
      "Phường Thịnh Liệt",
      "Phường Trần Phú",
      "Phường Tương Mai",
      "Phường Vĩnh Hưng",
      "Phường Yên Sở",
    ],
  },
  {
    name: "Quận Long Biên",
    lat: 21.0362,
    lng: 105.8943,
    wards: [
      "Phường Bồ Đề",
      "Phường Cự Khối",
      "Phường Đức Giang",
      "Phường Gia Thụy",
      "Phường Giang Biên",
      "Phường Long Biên",
      "Phường Ngọc Lâm",
      "Phường Ngọc Thụy",
      "Phường Phúc Đồng",
      "Phường Phúc Lợi",
      "Phường Sài Đồng",
      "Phường Thạch Bàn",
      "Phường Thượng Thanh",
      "Phường Việt Hưng",
    ],
  },
  {
    name: "Quận Tây Hồ",
    lat: 21.0718,
    lng: 105.8234,
    wards: [
      "Phường Bưởi",
      "Phường Nhật Tân",
      "Phường Phú Thượng",
      "Phường Quảng An",
      "Phường Thụy Khuê",
      "Phường Tứ Liên",
      "Phường Xuân La",
      "Phường Yên Phụ",
    ],
  },
  {
    name: "Huyện Hoài Đức",
    lat: 21.0267,
    lng: 105.7077,
    wards: [
      "Thị trấn Trạm Trôi",
      "Xã An Khánh",
      "Xã An Thượng",
      "Xã Cát Quế",
      "Xã Di Trạch",
      "Xã Đức Giang",
      "Xã Đức Thượng",
      "Xã Đắc Sở",
      "Xã Đông La",
      "Xã Dương Liễu",
      "Xã Kim Chung",
      "Xã La Phù",
      "Xã Lại Yên",
      "Xã Minh Khai",
      "Xã Song Phương",
      "Xã Tiền Yên",
      "Xã Vân Canh",
      "Xã Vân Côn",
      "Xã Yên Sở",
    ],
  },
  {
    name: "Huyện Gia Lâm",
    lat: 21.0194,
    lng: 105.9408,
    wards: [
      "Thị trấn Trâu Quỳ",
      "Thị trấn Yên Viên",
      "Xã Bát Tràng",
      "Xã Cổ Bi",
      "Xã Dương Xá",
      "Xã Dương Quang",
      "Xã Đa Tốn",
      "Xã Đặng Xá",
      "Xã Đình Xuyên",
      "Xã Đông Dư",
      "Xã Kiêu Kỵ",
      "Xã Kim Lan",
      "Xã Kim Sơn",
      "Xã Lệ Chi",
      "Xã Ninh Hiệp",
      "Xã Phù Đổng",
      "Xã Phú Thị",
      "Xã Trung Mầu",
      "Xã Văn Đức",
      "Xã Yên Thường",
      "Xã Yên Viên",
    ],
  },
  {
    name: "Huyện Đông Anh",
    lat: 21.1408,
    lng: 105.8456,
    wards: [
      "Thị trấn Đông Anh",
      "Xã Bắc Hồng",
      "Xã Cổ Loa",
      "Xã Dục Tú",
      "Xã Đại Mạch",
      "Xã Đông Hội",
      "Xã Hải Bối",
      "Xã Kim Chung",
      "Xã Kim Nỗ",
      "Xã Liên Hà",
      "Xã Mai Lâm",
      "Xã Nam Hồng",
      "Xã Nguyên Khê",
      "Xã Tàm Xá",
      "Xã Thụy Lâm",
      "Xã Tiên Dương",
      "Xã Uy Nỗ",
      "Xã Vân Hà",
      "Xã Vân Nội",
      "Xã Việt Hùng",
      "Xã Vĩnh Ngọc",
      "Xã Võng La",
      "Xã Xuân Canh",
      "Xã Xuân Nộn",
    ],
  },
  {
    name: "Huyện Thanh Trì",
    lat: 20.9419,
    lng: 105.8532,
    wards: [
      "Thị trấn Văn Điển",
      "Xã Đại Áng",
      "Xã Duyên Hà",
      "Xã Đông Mỹ",
      "Xã Hữu Hòa",
      "Xã Liên Ninh",
      "Xã Ngọc Hồi",
      "Xã Ngũ Hiệp",
      "Xã Tả Thanh Oai",
      "Xã Tam Hiệp",
      "Xã Tân Triều",
      "Xã Thanh Liệt",
      "Xã Tứ Hiệp",
      "Xã Vạn Phúc",
      "Xã Vĩnh Quỳnh",
      "Xã Yên Mỹ",
    ],
  },
  {
    name: "Huyện Đan Phượng",
    lat: 21.0967,
    lng: 105.6705,
    wards: [
      "Thị trấn Phùng",
      "Xã Đan Phượng",
      "Xã Đồng Tháp",
      "Xã Hạ Mỗ",
      "Xã Hồng Hà",
      "Xã Liên Hà",
      "Xã Liên Hồng",
      "Xã Liên Trung",
      "Xã Phương Đình",
      "Xã Song Phượng",
      "Xã Tân Hội",
      "Xã Tân Lập",
      "Xã Thọ An",
      "Xã Thọ Xuân",
      "Xã Thượng Mỗ",
      "Xã Trung Châu",
    ],
  },
  {
    name: "Huyện Thạch Thất",
    lat: 21.0028,
    lng: 105.5342,
    wards: [
      "Thị trấn Liên Quan",
      "Xã Bình Phú",
      "Xã Bình Yên",
      "Xã Cẩm Yên",
      "Xã Cần Kiệm",
      "Xã Canh Nậu",
      "Xã Chàng Sơn",
      "Xã Dị Nậu",
      "Xã Đại Đồng",
      "Xã Đồng Trúc",
      "Xã Hạ Bằng",
      "Xã Hương Ngải",
      "Xã Hữu Bằng",
      "Xã Kim Quan",
      "Xã Lại Thượng",
      "Xã Phú Kim",
      "Xã Phùng Xá",
      "Xã Tân Xã",
      "Xã Thạch Hòa",
      "Xã Thạch Xá",
      "Xã Tiến Xuân",
      "Xã Yên Bình",
      "Xã Yên Trung",
    ],
  },
  {
    name: "Huyện Quốc Oai",
    lat: 20.9856,
    lng: 105.6325,
    wards: [
      "Thị trấn Quốc Oai",
      "Xã Cấn Hữu",
      "Xã Cộng Hòa",
      "Xã Đại Thành",
      "Xã Đồng Quang",
      "Xã Đông Yên",
      "Xã Hòa Thạch",
      "Xã Liệp Tuyết",
      "Xã Nghĩa Hương",
      "Xã Ngọc Liệp",
      "Xã Ngọc Mỹ",
      "Xã Phú Cát",
      "Xã Phú Mãn",
      "Xã Phượng Cách",
      "Xã Sài Sơn",
      "Xã Tân Hòa",
      "Xã Tân Phú",
      "Xã Thạch Thán",
      "Xã Tuyết Nghĩa",
      "Xã Yên Sơn",
      "Xã Đông Xuân",
    ],
  },
  {
    name: "Huyện Chương Mỹ",
    lat: 20.8769,
    lng: 105.6989,
    wards: [
      "Thị trấn Chúc Sơn",
      "Thị trấn Xuân Mai",
      "Xã Đại Yên",
      "Xã Đông Phương Yên",
      "Xã Đông Sơn",
      "Xã Đồng Lạc",
      "Xã Đồng Phú",
      "Xã Hòa Chính",
      "Xã Hoàng Diệu",
      "Xã Hoàng Văn Thụ",
      "Xã Hợp Đồng",
      "Xã Hữu Văn",
      "Xã Lam Điền",
      "Xã Mỹ Lương",
      "Xã Nam Phương Tiến",
      "Xã Ngọc Hòa",
      "Xã Phú Nam An",
      "Xã Phú Nghĩa",
      "Xã Phụng Châu",
      "Xã Quảng Bị",
      "Xã Tân Tiến",
      "Xã Tiên Phương",
      "Xã Tốt Động",
      "Xã Thanh Bình",
      "Xã Thủy Xuân Tiên",
      "Xã Thụy Hương",
      "Xã Thượng Vực",
      "Xã Trần Phú",
      "Xã Trung Hòa",
      "Xã Trường Yên",
      "Xã Văn Võ",
    ],
  },
  {
    name: "Huyện Sóc Sơn",
    lat: 21.2728,
    lng: 105.8471,
    wards: [
      "Thị trấn Sóc Sơn",
      "Xã Bắc Phú",
      "Xã Bắc Sơn",
      "Xã Đông Xuân",
      "Xã Đức Hòa",
      "Xã Hiền Ninh",
      "Xã Hồng Kỳ",
      "Xã Kim Lũ",
      "Xã Mai Đình",
      "Xã Minh Phú",
      "Xã Minh Trí",
      "Xã Nam Sơn",
      "Xã Phú Cường",
      "Xã Phù Linh",
      "Xã Phù Lỗ",
      "Xã Phú Minh",
      "Xã Quang Tiến",
      "Xã Tân Dân",
      "Xã Tân Hưng",
      "Xã Tân Minh",
      "Xã Thanh Xuân",
      "Xã Tiên Dược",
      "Xã Trung Giã",
      "Xã Việt Long",
      "Xã Xuân Giang",
      "Xã Xuân Thu",
    ],
  },
  {
    name: "Huyện Mê Linh",
    lat: 21.1784,
    lng: 105.7142,
    wards: [
      "Thị trấn Chi Đông",
      "Thị trấn Quang Minh",
      "Xã Chu Phan",
      "Xã Đại Thịnh",
      "Xã Hoàng Kim",
      "Xã Kim Hoa",
      "Xã Liên Mạc",
      "Xã Mê Linh",
      "Xã Tam Đồng",
      "Xã Thạch Đà",
      "Xã Thanh Lâm",
      "Xã Tiền Phong",
      "Xã Tự Lập",
      "Xã Tráng Việt",
      "Xã Vạn Yên",
      "Xã Văn Khê",
    ],
  },
  {
    name: "Huyện Thanh Oai",
    lat: 20.8711,
    lng: 105.7825,
    wards: [
      "Thị trấn Kim Bài",
      "Xã Bích Hòa",
      "Xã Bình Minh",
      "Xã Cao Dương",
      "Xã Cao Viên",
      "Xã Cự Khê",
      "Xã Dân Hòa",
      "Xã Đỗ Động",
      "Xã Hồng Dương",
      "Xã Kim An",
      "Xã Kim Thư",
      "Xã Liên Châu",
      "Xã Mỹ Hưng",
      "Xã Phương Trung",
      "Xã Tam Hưng",
      "Xã Tân Ước",
      "Xã Thanh Cao",
      "Xã Thanh Mai",
      "Xã Thanh Thùy",
      "Xã Thanh Văn",
      "Xã Xuân Dương",
    ],
  },
  {
    name: "Huyện Thường Tín",
    lat: 20.8722,
    lng: 105.8647,
    wards: [
      "Thị trấn Thường Tín",
      "Xã Chương Dương",
      "Xã Dũng Tiến",
      "Xã Duyên Thái",
      "Xã Hà Hồi",
      "Xã Hiền Giang",
      "Xã Hòa Bình",
      "Xã Khánh Hà",
      "Xã Hồng Vân",
      "Xã Liên Phương",
      "Xã Minh Cường",
      "Xã Nghiêm Xuyên",
      "Xã Nguyễn Trãi",
      "Xã Nhị Khê",
      "Xã Ninh Sở",
      "Xã Quất Động",
      "Xã Tân Minh",
      "Xã Thắng Lợi",
      "Xã Thống Nhất",
      "Xã Thư Phú",
      "Xã Tiền Phong",
      "Xã Tô Hiệu",
      "Xã Tự Nhiên",
      "Xã Vạn Điểm",
      "Xã Văn Bình",
      "Xã Văn Phú",
      "Xã Văn Tự",
      "Xã Vân Tảo",
    ],
  },
  {
    name: "Huyện Phú Xuyên",
    lat: 20.7383,
    lng: 105.9083,
    wards: [
      "Thị trấn Phú Xuyên",
      "Thị trấn Phú Minh",
      "Xã Bạch Hạ",
      "Xã Châu Can",
      "Xã Chuyên Mỹ",
      "Xã Đại Thắng",
      "Xã Đại Xuyên",
      "Xã Hoàng Long",
      "Xã Hồng Minh",
      "Xã Hồng Thái",
      "Xã Khai Thái",
      "Xã Nam Phong",
      "Xã Nam Triều",
      "Xã Phú Túc",
      "Xã Phú Yên",
      "Xã Phúc Tiến",
      "Xã Phượng Dực",
      "Xã Quang Lãng",
      "Xã Quang Trung",
      "Xã Sơn Hà",
      "Xã Tân Dân",
      "Xã Thụy Phú",
      "Xã Tri Thủy",
      "Xã Tri Trung",
      "Xã Văn Hoàng",
      "Xã Vân Từ",
    ],
  },
  {
    name: "Huyện Ứng Hòa",
    lat: 20.7425,
    lng: 105.7739,
    wards: [
      "Thị trấn Vân Đình",
      "Xã Cao Thành",
      "Xã Đại Cường",
      "Xã Đại Hùng",
      "Xã Đội Bình",
      "Xã Đông Lỗ",
      "Xã Đồng Tân",
      "Xã Đồng Tiến",
      "Xã Hoa Sơn",
      "Xã Hòa Lâm",
      "Xã Hòa Nam",
      "Xã Hòa Phú",
      "Xã Hòa Xá",
      "Xã Hồng Quang",
      "Xã Kim Đường",
      "Xã Liên Bạt",
      "Xã Lưu Hoàng",
      "Xã Minh Đức",
      "Xã Phù Lưu",
      "Xã Phương Tú",
      "Xã Quảng Phú Cầu",
      "Xã Tảo Dương Văn",
      "Xã Trầm Lộng",
      "Xã Trung Tú",
      "Xã Trường Thịnh",
      "Xã Vạn Thái",
      "Xã Viên An",
      "Xã Viên Nội",
    ],
  },
  {
    name: "Huyện Mỹ Đức",
    lat: 20.6789,
    lng: 105.7367,
    wards: [
      "Thị trấn Đại Nghĩa",
      "Xã An Mỹ",
      "Xã An Phú",
      "Xã An Tiến",
      "Xã Bột Xuyên",
      "Xã Đại Hưng",
      "Xã Đốc Tín",
      "Xã Đồng Tâm",
      "Xã Hồng Sơn",
      "Xã Hợp Thanh",
      "Xã Hợp Tiến",
      "Xã Hùng Tiến",
      "Xã Hương Sơn",
      "Xã Lê Thanh",
      "Xã Mỹ Thành",
      "Xã Phù Lưu Tế",
      "Xã Phúc Lâm",
      "Xã Phùng Xá",
      "Xã Thượng Lâm",
      "Xã Tuy Lai",
      "Xã Vạn Kim",
      "Xã Xuy Xá",
    ],
  },
  {
    name: "Huyện Ba Vì",
    lat: 21.2056,
    lng: 105.3789,
    wards: [
      "Thị trấn Tây Đằng",
      "Xã Ba Trại",
      "Xã Ba Vì",
      "Xã Cẩm Lĩnh",
      "Xã Cam Thượng",
      "Xã Châu Sơn",
      "Xã Chu Minh",
      "Xã Cổ Đô",
      "Xã Đông Quang",
      "Xã Đồng Thái",
      "Xã Khánh Thượng",
      "Xã Minh Châu",
      "Xã Minh Quang",
      "Xã Phong Vân",
      "Xã Phú Châu",
      "Xã Phú Cường",
      "Xã Phú Đông",
      "Xã Phú Phương",
      "Xã Phú Sơn",
      "Xã Sơn Đà",
      "Xã Tân Hồng",
      "Xã Tân Linh",
      "Xã Thái Hòa",
      "Xã Thuần Mỹ",
      "Xã Thụy An",
      "Xã Tiên Phong",
      "Xã Tòng Bạt",
      "Xã Vân Hòa",
      "Xã Vạn Thắng",
      "Xã Vật Lại",
      "Xã Yên Bài",
    ],
  },
  {
    name: "Huyện Phúc Thọ",
    lat: 21.1111,
    lng: 105.5689,
    wards: [
      "Thị trấn Phúc Thọ",
      "Xã Hát Môn",
      "Xã Hiệp Thuận",
      "Xã Liên Hiệp",
      "Xã Long Xuyên",
      "Xã Ngọc Tảo",
      "Xã Phúc Hòa",
      "Xã Phụng Thượng",
      "Xã Sen Phương",
      "Xã Tam Hiệp",
      "Xã Tam Thuấn",
      "Xã Thanh Đa",
      "Xã Thọ Lộc",
      "Xã Tích Giang",
      "Xã Trạch Mỹ Lộc",
      "Xã Vân Hà",
      "Xã Vân Nam",
      "Xã Vân Phúc",
      "Xã Võng Xuyên",
      "Xã Xuân Đình",
    ],
  },
  {
    name: "Thị xã Sơn Tây",
    lat: 21.1378,
    lng: 105.5039,
    wards: [
      "Phường Lê Lợi",
      "Phường Ngô Quyền",
      "Phường Phú Thịnh",
      "Phường Quang Trung",
      "Phường Sơn Lộc",
      "Phường Trung Hưng",
      "Phường Trung Sơn Trầm",
      "Phường Viên Sơn",
      "Phường Xuân Khanh",
      "Xã Cổ Đông",
      "Xã Đường Lâm",
      "Xã Kim Sơn",
      "Xã Sơn Đông",
      "Xã Thanh Mỹ",
      "Xã Xuân Sơn",
    ],
  },
];

// Danh sách các ngân hàng tại Việt Nam
export const VIETNAMESE_BANKS = [
  { code: "MB", name: "MB Bank (Ngân hàng Quân Đội)" },
  { code: "VCB", name: "Vietcombank (Ngoại Thương VN)" },
  { code: "CTG", name: "VietinBank (Công Thương VN)" },
  { code: "BIDV", name: "BIDV (Đầu tư & Phát triển VN)" },
  { code: "TCB", name: "Techcombank (Kỹ Thương VN)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
  { code: "MSB", name: "MSB (Hàng Hải VN)" },
  { code: "VIB", name: "VIB (Quốc Tế VN)" },
  { code: "VBA", name: "Agribank (Nông Nghiệp & PTNT)" },
];

// Khung giờ khảo sát theo Sáng / Chiều / Tối
export const TIME_SLOT_GROUPS = [
  {
    group: "Sáng",
    icon: "🌅",
    label: "Buổi Sáng",
    period: "08:00 - 12:00",
    slots: [
      { time: "08:00", label: "08:00", range: "08:00 - 09:30", desc: "Sáng sớm" },
      { time: "09:30", label: "09:30", range: "09:30 - 11:00", desc: "Giữa buổi sáng" },
      { time: "11:00", label: "11:00", range: "11:00 - 12:00", desc: "Cuối buổi sáng" },
    ],
  },
  {
    group: "Chiều",
    icon: "☀️",
    label: "Buổi Chiều",
    period: "13:30 - 17:30",
    slots: [
      { time: "14:00", label: "14:00", range: "14:00 - 15:30", desc: "Đầu giờ chiều" },
      { time: "15:30", label: "15:30", range: "15:30 - 17:00", desc: "Giữa buổi chiều" },
      { time: "17:00", label: "17:00", range: "17:00 - 18:00", desc: "Cuối buổi chiều" },
    ],
  },
  {
    group: "Tối",
    icon: "🌙",
    label: "Buổi Tối",
    period: "18:00 - 20:30",
    slots: [
      { time: "18:30", label: "18:30", range: "18:30 - 19:30", desc: "Đầu giờ tối" },
      { time: "19:30", label: "19:30", range: "19:30 - 20:30", desc: "Buổi tối" },
    ],
  },
];

/**
 * Lấy toạ độ [lng, lat] trung tâm của một Quận/Huyện cho Mapbox
 */
export function getDistrictLngLat(districtName) {
  if (!districtName) return HANOI_CENTER_LNG_LAT;
  const found = HANOI_DISTRICTS.find(
    (d) => d.name === districtName || districtName.includes(d.name) || d.name.includes(districtName)
  );
  if (found && found.lat && found.lng) {
    return [found.lng, found.lat];
  }
  return HANOI_CENTER_LNG_LAT;
}

/**
 * Tìm Quận/Huyện gần nhất theo khoảng cách toạ độ Euclide xấp xỉ
 */
export function findNearestHanoiDistrict(lat, lng) {
  if (!lat || !lng) return HANOI_DISTRICTS[1].name; // Default: Quận Cầu Giấy
  let minDistance = Infinity;
  let nearestDistrict = HANOI_DISTRICTS[0].name;

  for (const d of HANOI_DISTRICTS) {
    const dLat = d.lat - lat;
    const dLng = d.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearestDistrict = d.name;
    }
  }
  return nearestDistrict;
}

/**
 * Khớp tên Quận/Huyện từ chuỗi thô trả về từ Geocoding
 */
export function matchHanoiDistrict(rawDistrictStr) {
  if (!rawDistrictStr || typeof rawDistrictStr !== "string") return "";
  const cleaned = rawDistrictStr.trim();
  for (const d of HANOI_DISTRICTS) {
    if (cleaned.includes(d.name) || d.name.includes(cleaned)) {
      return d.name;
    }
    const simple = d.name.replace(/^(Quận|Huyện|Thị xã)\s+/gi, "");
    if (cleaned.includes(simple) || simple.includes(cleaned)) {
      return d.name;
    }
  }
  return "";
}

/**
 * Tự động tìm Quận/Huyện tương ứng từ tên Phường/Xã (Cross-district Ward lookup)
 */
export function findDistrictByWard(rawWardStr) {
  if (!rawWardStr || typeof rawWardStr !== "string") return null;
  const cleaned = rawWardStr.trim();

  for (const d of HANOI_DISTRICTS) {
    for (const w of d.wards) {
      if (cleaned.includes(w) || w.includes(cleaned)) {
        return { district: d.name, ward: w };
      }
      const simpleW = w.replace(/^(Phường|Xã|Thị trấn)\s+/gi, "");
      if (simpleW.length > 2 && (cleaned.includes(simpleW) || simpleW.includes(cleaned))) {
        return { district: d.name, ward: w };
      }
    }
  }
  return null;
}

/**
 * Khớp tên Phường/Xã từ chuỗi thô theo Quận
 */
export function matchHanoiWard(districtName, rawWardStr) {
  if (!rawWardStr) return "";
  const cleaned = rawWardStr.trim();

  if (districtName) {
    const dObj = HANOI_DISTRICTS.find((d) => d.name === districtName);
    if (dObj) {
      for (const w of dObj.wards) {
        if (cleaned.includes(w) || w.includes(cleaned)) {
          return w;
        }
        const simple = w.replace(/^(Phường|Xã|Thị trấn)\s+/gi, "");
        if (simple.length > 2 && (cleaned.includes(simple) || simple.includes(cleaned))) {
          return w;
        }
      }
    }
  }

  // Nếu không tìm thấy trong Quận hiện tại, quét trên toàn Hà Nội
  const crossMatch = findDistrictByWard(rawWardStr);
  if (crossMatch) {
    return crossMatch.ward;
  }

  return cleaned.startsWith("Phường ") || cleaned.startsWith("Xã ") || cleaned.startsWith("Thị trấn ")
    ? cleaned
    : `Phường ${cleaned}`;
}

/**
 * Loại bỏ triệt để các phần trùng lặp (Tên Quận, Tên Phường, TP Hà Nội) khỏi chuỗi số nhà/đường
 */
export function cleanStreetAddress(street, ward = "", district = "") {
  if (!street || typeof street !== "string") return "";
  let s = street;

  s = s.replace(/,?\s*(TP\.?|Thành phố|Tỉnh)?\s*Hà Nội/gi, "");
  s = s.replace(/,?\s*Việt Nam/gi, "");

  for (const d of HANOI_DISTRICTS) {
    s = s.replace(new RegExp(`,?\\s*${d.name}`, "gi"), "");
    const rawDist = d.name.replace(/^(Quận|Huyện|Thị xã)\s+/gi, "");
    if (rawDist.length > 2) {
      s = s.replace(new RegExp(`,?\\s*${rawDist}`, "gi"), "");
    }
  }

  if (district) {
    const dObj = HANOI_DISTRICTS.find((d) => d.name === district);
    if (dObj) {
      for (const w of dObj.wards) {
        s = s.replace(new RegExp(`,?\\s*${w}`, "gi"), "");
        const rawWard = w.replace(/^(Phường|Xã|Thị trấn)\s+/gi, "");
        if (rawWard.length > 2) {
          s = s.replace(new RegExp(`,?\\s*${rawWard}`, "gi"), "");
        }
      }
    }
  }
  if (ward) {
    s = s.replace(new RegExp(`,?\\s*${ward}`, "gi"), "");
    const rawW = ward.replace(/^(Phường|Xã|Thị trấn)\s+/gi, "");
    if (rawW.length > 2) {
      s = s.replace(new RegExp(`,?\\s*${rawW}`, "gi"), "");
    }
  }

  s = s.replace(/,\s*,+/g, ", ").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  return s;
}

/**
 * Phân tách chuỗi địa chỉ thành { street, ward, district, isHanoi }
 */
export function parseHanoiAddress(fullAddress) {
  if (!fullAddress || typeof fullAddress !== "string") {
    return { street: "", ward: "", district: "", isHanoi: false };
  }

  let foundDistrict = "";
  let foundWard = "";

  for (const d of HANOI_DISTRICTS) {
    const rawDist = d.name.replace(/^(Quận|Huyện|Thị xã)\s+/gi, "");
    if (fullAddress.includes(d.name) || (rawDist.length > 2 && fullAddress.includes(rawDist))) {
      foundDistrict = d.name;
      for (const w of d.wards) {
        const rawWard = w.replace(/^(Phường|Xã|Thị trấn)\s+/gi, "");
        if (fullAddress.includes(w) || (rawWard.length > 2 && fullAddress.includes(rawWard))) {
          foundWard = w;
          break;
        }
      }
      break;
    }
  }

  // Nếu chưa tìm thấy District nhưng trong chuỗi có tên Phường/Xã
  if (!foundDistrict) {
    const cross = findDistrictByWard(fullAddress);
    if (cross) {
      foundDistrict = cross.district;
      foundWard = cross.ward;
    }
  }

  const street = cleanStreetAddress(fullAddress, foundWard, foundDistrict);

  return {
    street,
    ward: foundWard,
    district: foundDistrict,
    isHanoi: Boolean(foundDistrict || /hà nội/i.test(fullAddress)),
  };
}

/**
 * Tạo chuỗi địa chỉ chuẩn: "{street}, {ward}, {district}, Hà Nội"
 */
export function formatHanoiAddress(street, ward, district) {
  const cleanedStreet = cleanStreetAddress(street, ward, district);
  const parts = [];
  if (cleanedStreet) parts.push(cleanedStreet);
  if (ward && ward.trim()) parts.push(ward.trim());
  if (district && district.trim()) parts.push(district.trim());
  if (cleanedStreet || ward || district) {
    parts.push("Hà Nội");
  }
  return parts.join(", ");
}

/**
 * Tìm kiếm gợi ý địa điểm / toạ độ tại Hà Nội qua Mapbox Geocoding Places API
 */
export async function searchHanoiMapbox(query, token = MAPBOX_PUBLIC_TOKEN) {
  if (!query || query.trim().length < 2) return [];
  try {
    const q = encodeURIComponent(query.includes("Hà Nội") ? query : `${query}, Hà Nội`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&country=vn&proximity=105.8542,21.0285&language=vi&limit=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features) return [];

    return data.features.map((feat) => {
      const [lng, lat] = feat.center;
      const placeName = feat.place_name || "";
      const text = feat.text || "";

      let district = "";
      let ward = "";

      // 1. Quét tìm Phường trước
      if (feat.context) {
        for (const ctx of feat.context) {
          const cross = findDistrictByWard(ctx.text);
          if (cross) {
            ward = cross.ward;
            district = cross.district;
            break;
          }
        }
      }
      if (!ward) {
        const cross = findDistrictByWard(placeName) || findDistrictByWard(text);
        if (cross) {
          ward = cross.ward;
          district = cross.district;
        }
      }

      // 2. Nếu chưa có district, quét tìm district từ context
      if (!district && feat.context) {
        for (const ctx of feat.context) {
          const matched = matchHanoiDistrict(ctx.text);
          if (matched) {
            district = matched;
            break;
          }
        }
      }
      if (!district) district = matchHanoiDistrict(placeName) || findNearestHanoiDistrict(lat, lng);

      if (!ward) ward = matchHanoiWard(district, placeName);

      let street = feat.address ? `${feat.address} ${text}` : text;
      street = cleanStreetAddress(street, ward, district);

      return {
        lat,
        lng,
        name: text || street || "Địa điểm tại Hà Nội",
        displayName: placeName,
        district,
        ward,
        street,
        fullFormatted: formatHanoiAddress(street, ward, district),
      };
    });
  } catch (err) {
    console.error("Mapbox search error:", err);
    return [];
  }
}

/**
 * Dịch ngược toạ độ (Reverse Geocode) sang địa chỉ chi tiết bằng Mapbox
 */
export async function reverseGeocodeMapbox(lng, lat, token = MAPBOX_PUBLIC_TOKEN) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=vi&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Mapbox reverse geocode failed");
    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      const fallbackDistrict = findNearestHanoiDistrict(lat, lng);
      return {
        lat: Number(lat),
        lng: Number(lng),
        district: fallbackDistrict,
        ward: "",
        street: "",
        displayName: `${fallbackDistrict}, Hà Nội`,
        fullFormatted: `${fallbackDistrict}, Hà Nội`,
      };
    }

    const feat = data.features[0];
    const placeName = feat.place_name || "";
    const text = feat.text || "";

    let district = "";
    let ward = "";

    // 1. Quét tìm Phường/Xã trước qua cross lookup
    if (feat.context) {
      for (const ctx of feat.context) {
        const cross = findDistrictByWard(ctx.text);
        if (cross) {
          ward = cross.ward;
          district = cross.district;
          break;
        }
      }
    }
    if (!ward) {
      const cross = findDistrictByWard(placeName) || findDistrictByWard(text);
      if (cross) {
        ward = cross.ward;
        district = cross.district;
      }
    }

    // 2. Tìm District nếu chưa có
    if (!district && feat.context) {
      for (const ctx of feat.context) {
        const matched = matchHanoiDistrict(ctx.text);
        if (matched) {
          district = matched;
          break;
        }
      }
    }
    if (!district) district = matchHanoiDistrict(placeName) || findNearestHanoiDistrict(lat, lng);

    if (!ward) ward = matchHanoiWard(district, placeName);

    let street = feat.address ? `${feat.address} ${text}` : text;
    street = cleanStreetAddress(street, ward, district);
    if (!street) {
      street = cleanStreetAddress(placeName, ward, district);
    }

    const fullFormatted = formatHanoiAddress(street, ward, district);

    return {
      lat: Number(lat),
      lng: Number(lng),
      district,
      ward,
      street,
      displayName: placeName || fullFormatted,
      fullFormatted,
    };
  } catch (err) {
    console.error("Mapbox reverse error:", err);
    const fallbackDistrict = findNearestHanoiDistrict(lat, lng);
    return {
      lat: Number(lat),
      lng: Number(lng),
      district: fallbackDistrict,
      ward: "",
      street: "",
      displayName: `${fallbackDistrict}, Hà Nội`,
      fullFormatted: `${fallbackDistrict}, Hà Nội`,
    };
  }
}
