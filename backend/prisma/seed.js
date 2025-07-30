"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sampleProducts = [
    // 스킨케어 - 클렌저
    {
        name: '젠틀 포밍 클렌저',
        description: '민감한 피부를 위한 부드러운 폼 클렌저입니다. 천연 성분으로 메이크업과 불순물을 깔끔하게 제거하면서도 피부 본연의 수분은 지켜줍니다.',
        shortDescription: '민감 피부를 위한 부드러운 폼 클렌저',
        price: 32000, // 320원 (cents)
        sku: 'MC-CL-001',
        category: '스킨케어',
        subCategory: '클렌저',
        ingredients: JSON.stringify(['세라마이드', '히알루론산', '판테놀', '알로에 베라']),
        usage: '아침, 저녁 세안 시 적당량을 손에 덜어 거품을 낸 후 얼굴 전체에 마사지하듯 발라주세요.',
        slug: 'gentle-foaming-cleanser',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
        ]),
        inventory: 50,
        isNew: true,
        publishedAt: new Date(),
    },
    {
        name: '딥 클렌징 오일',
        description: '워터프루프 메이크업까지 깔끔하게 제거하는 클렌징 오일입니다. 식물성 오일로 만들어져 피부에 부담을 주지 않으면서도 깊숙한 노폐물까지 제거합니다.',
        shortDescription: '워터프루프 메이크업 제거용 클렌징 오일',
        price: 28000,
        sku: 'MC-CL-002',
        category: '스킨케어',
        subCategory: '클렌저',
        ingredients: JSON.stringify(['호호바 오일', '올리브 오일', '로즈힙 오일']),
        usage: '건조한 손과 얼굴에 충분한 양을 발라 마사지한 후 미지근한 물로 헹궈주세요.',
        slug: 'deep-cleansing-oil',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
        ]),
        inventory: 35,
        isBestseller: true,
        publishedAt: new Date(),
    },
    // 스킨케어 - 토너
    {
        name: '하이드레이팅 토너',
        description: '깊은 수분 공급으로 건조한 피부에 생기를 불어넣는 하이드레이팅 토너입니다. 7가지 히알루론산이 피부 깊숙이 수분을 전달합니다.',
        shortDescription: '7가지 히알루론산 수분 토너',
        price: 35000,
        compareAtPrice: 45000,
        sku: 'MC-TN-001',
        category: '스킨케어',
        subCategory: '토너',
        ingredients: JSON.stringify(['히알루론산', '나이아신아마이드', '베타글루칸', '알란토인']),
        usage: '세안 후 화장솜 또는 손바닥에 적당량을 덜어 얼굴 전체에 부드럽게 발라주세요.',
        slug: 'hydrating-toner',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600',
        ]),
        inventory: 42,
        isBestseller: true,
        publishedAt: new Date(),
    },
    // 스킨케어 - 세럼
    {
        name: '비타민 C 브라이트닝 세럼',
        description: '10% 비타민 C로 칙칙한 피부 톤을 밝게 개선하는 브라이트닝 세럼입니다. 항산화 성분이 풍부해 환경적 스트레스로부터 피부를 보호합니다.',
        shortDescription: '10% 비타민 C 브라이트닝 세럼',
        price: 68000,
        sku: 'MC-SR-001',
        category: '스킨케어',
        subCategory: '세럼',
        ingredients: JSON.stringify(['비타민 C', '비타민 E', '페룰산', '히알루론산']),
        usage: '토너 후 2-3방울을 손바닥에 덜어 얼굴 전체에 부드럽게 발라주세요. 아침 사용 시 자외선 차단제 필수.',
        slug: 'vitamin-c-brightening-serum',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=400',
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=600',
        ]),
        inventory: 28,
        featured: true,
        publishedAt: new Date(),
    },
    {
        name: '레티놀 안티에이징 세럼',
        description: '순한 레티놀로 주름과 잔주름을 개선하는 안티에이징 세럼입니다. 초보자도 사용하기 좋은 마일드한 농도로 제작되었습니다.',
        shortDescription: '순한 레티놀 안티에이징 세럼',
        price: 85000,
        sku: 'MC-SR-002',
        category: '스킨케어',
        subCategory: '세럼',
        ingredients: JSON.stringify(['레티놀', '스쿠알란', '세라마이드', '판테놀']),
        usage: '저녁에만 사용하며, 토너 후 1-2방울을 발라주세요. 처음 사용 시 주 2-3회부터 시작하세요.',
        slug: 'retinol-anti-aging-serum',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
        ]),
        inventory: 18,
        isNew: true,
        publishedAt: new Date(),
    },
    // 스킨케어 - 모이스처라이저
    {
        name: '올-인-원 모이스처라이저',
        description: '하나로 끝내는 올인원 모이스처라이저입니다. 수분, 영양, 보호막까지 한 번에 해결하는 멀티 기능성 크림입니다.',
        shortDescription: '수분, 영양, 보호막 올인원 크림',
        price: 52000,
        sku: 'MC-CR-001',
        category: '스킨케어',
        subCategory: '모이스처라이저',
        ingredients: JSON.stringify(['세라마이드', '콜라겐', '아데노신', '시어버터']),
        usage: '스킨케어 마지막 단계에서 얼굴 전체에 부드럽게 발라주세요.',
        slug: 'all-in-one-moisturizer',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
        ]),
        inventory: 45,
        isBestseller: true,
        publishedAt: new Date(),
    },
    // 메이크업 - 베이스
    {
        name: '내추럴 글로우 파운데이션',
        description: '자연스러운 윤기와 완벽한 커버력을 동시에 선사하는 파운데이션입니다. 스킨케어 성분이 함유되어 하루 종일 촉촉함을 유지합니다.',
        shortDescription: '자연스러운 윤기의 스킨케어 파운데이션',
        price: 45000,
        sku: 'MC-FD-001',
        category: '메이크업',
        subCategory: '베이스',
        ingredients: JSON.stringify(['히알루론산', '나이아신아마이드', 'SPF 30']),
        usage: '소량을 얼굴 중앙부터 바깥쪽으로 발라주세요.',
        slug: 'natural-glow-foundation',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600',
        ]),
        inventory: 30,
        featured: true,
        publishedAt: new Date(),
    },
    {
        name: '롱래스팅 컨실러',
        description: '24시간 지속되는 하이커버 컨실러입니다. 다크서클, 잡티, 여드름 흔적까지 완벽하게 커버하면서도 자연스러운 마무리를 연출합니다.',
        shortDescription: '24시간 지속 하이커버 컨실러',
        price: 28000,
        sku: 'MC-CC-001',
        category: '메이크업',
        subCategory: '베이스',
        ingredients: JSON.stringify(['히알루론산', '비타민 E', '세라마이드']),
        usage: '커버하고 싶은 부위에 소량씩 발라 두드려주세요.',
        slug: 'long-lasting-concealer',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=400',
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=600',
        ]),
        inventory: 38,
        isNew: true,
        publishedAt: new Date(),
    },
    // 메이크업 - 립
    {
        name: '벨벳 매트 립스틱',
        description: '부드러운 벨벳 텍스처의 매트 립스틱입니다. 오래 지속되면서도 건조하지 않은 편안한 착용감을 선사합니다.',
        shortDescription: '부드러운 벨벳 텍스처 매트 립스틱',
        price: 32000,
        sku: 'MC-LP-001',
        category: '메이크업',
        subCategory: '립',
        ingredients: JSON.stringify(['시어버터', '비타민 E', '호호바 오일']),
        usage: '입술 중앙부터 바깥쪽으로 발라주세요.',
        slug: 'velvet-matte-lipstick',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
        ]),
        inventory: 55,
        isBestseller: true,
        publishedAt: new Date(),
    },
    {
        name: '글로시 립 오일',
        description: '자연스러운 윤기와 깊은 보습을 동시에 선사하는 립 오일입니다. 가벼운 텍스처로 끈적임 없이 촉촉함이 오래 지속됩니다.',
        shortDescription: '자연스러운 윤기의 보습 립 오일',
        price: 25000,
        sku: 'MC-LP-002',
        category: '메이크업',
        subCategory: '립',
        ingredients: JSON.stringify(['아르간 오일', '로즈힙 오일', '비타민 E']),
        usage: '입술에 적당량을 발라주세요. 수시로 덧발라도 좋습니다.',
        slug: 'glossy-lip-oil',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
        ]),
        inventory: 42,
        featured: true,
        publishedAt: new Date(),
    },
    // 바디케어
    {
        name: '바디 로션',
        description: '온 몸에 사용할 수 있는 부드럽고 향긋한 바디 로션입니다. 건조한 피부에 깊은 수분을 공급하며 은은한 향이 오래 지속됩니다.',
        shortDescription: '부드럽고 향긋한 바디 보습 로션',
        price: 38000,
        sku: 'MC-BD-001',
        category: '바디케어',
        subCategory: '로션',
        ingredients: JSON.stringify(['시어버터', '코코넛 오일', '알로에 베라', '라벤더']),
        usage: '샤워 후 물기가 마르기 전에 전신에 발라주세요.',
        slug: 'nourishing-body-lotion',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600',
        ]),
        inventory: 65,
        isBestseller: true,
        publishedAt: new Date(),
    },
    // 향수
    {
        name: '시그니처 퍼퓸',
        description: 'MICOZ만의 독특한 시그니처 향수입니다. 베르가못의 상쾌함과 라벤더의 우아함, 바닐라의 달콤함이 조화롭게 어우러진 매혹적인 향으로 하루 종일 은은하게 지속됩니다.',
        shortDescription: 'MICOZ만의 시그니처 향수',
        price: 95000,
        sku: 'MC-PF-001',
        category: '향수',
        subCategory: '오드 뚜왈렛',
        ingredients: JSON.stringify(['베르가못', '라벤더', '바닐라', '머스크']),
        usage: '손목, 목, 귀 뒤 등 맥박이 뛰는 부위에 1-2회 분사해주세요.',
        slug: 'signature-perfume',
        images: JSON.stringify([
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=400',
            'https://images.unsplash.com/photo-1556228922-dfd58c95a6b9?w=600',
        ]),
        inventory: 25,
        featured: true,
        isNew: true,
        publishedAt: new Date(),
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting to seed database...');
        // Clear existing products
        yield prisma.product.deleteMany();
        console.log('Cleared existing products');
        // Create products
        for (const productData of sampleProducts) {
            const product = yield prisma.product.create({
                data: productData,
            });
            console.log(`Created product: ${product.name}`);
            // Create some variants for certain products
            if (productData.category === '메이크업') {
                if (productData.subCategory === '베이스') {
                    // Foundation shades
                    const shades = [
                        { name: '21호 라이트', price: productData.price },
                        { name: '23호 내추럴', price: productData.price },
                        { name: '25호 미디엄', price: productData.price },
                    ];
                    for (let i = 0; i < shades.length; i++) {
                        yield prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                name: shades[i].name,
                                sku: `${productData.sku}-${i + 1}`,
                                price: shades[i].price,
                                inventory: Math.floor(Math.random() * 20) + 5,
                                position: i,
                            },
                        });
                    }
                }
                else if (productData.subCategory === '립') {
                    // Lip colors
                    const colors = [
                        { name: 'Rose Pink', price: productData.price },
                        { name: 'Coral Red', price: productData.price },
                        { name: 'Berry Brown', price: productData.price },
                        { name: 'Nude Beige', price: productData.price },
                    ];
                    for (let i = 0; i < colors.length; i++) {
                        yield prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                name: colors[i].name,
                                sku: `${productData.sku}-${i + 1}`,
                                price: colors[i].price,
                                inventory: Math.floor(Math.random() * 30) + 10,
                                position: i,
                            },
                        });
                    }
                }
            }
            else if (productData.category === '스킨케어' && productData.name.includes('세럼')) {
                // Serum sizes
                const sizes = [
                    { name: '15ml', price: productData.price * 0.6 },
                    { name: '30ml', price: productData.price },
                    { name: '50ml', price: productData.price * 1.5 },
                ];
                for (let i = 0; i < sizes.length; i++) {
                    yield prisma.productVariant.create({
                        data: {
                            productId: product.id,
                            name: sizes[i].name,
                            sku: `${productData.sku}-${i + 1}`,
                            price: Math.round(sizes[i].price),
                            inventory: Math.floor(Math.random() * 25) + 5,
                            position: i,
                        },
                    });
                }
            }
        }
        console.log('Database seeded successfully!');
    });
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
