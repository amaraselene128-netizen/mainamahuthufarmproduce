import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { TopShops } from "@/components/home/TopShops";
import { FlashSales } from "@/components/home/FlashSales";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { PremiumShops } from "@/components/home/PremiumShops";
import { FeaturedShops } from "@/components/home/FeaturedShops";
import { TrustSection } from "@/components/home/TrustSection";
import { YouMightAlsoLike } from "@/components/home/YouMightAlsoLike";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TopShops />
      <FlashSales />
      <CategorySection />
      <PremiumShops />
      <FeaturedListings />
      <FeaturedShops />
      <TrustSection />
      <YouMightAlsoLike />
      <CTASection />
    </Layout>
  );
};

export default Index;
