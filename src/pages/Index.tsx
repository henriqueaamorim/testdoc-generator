import { DocumentationWizard } from "@/components/DocumentationWizard";
import heroBackground from "@/assets/qa-hero-bg.jpg";

const Index = () => {
  return (
    <div 
      className="min-h-screen bg-gradient-subtle bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="absolute inset-0 bg-background/95" />
      <div className="relative">
        <DocumentationWizard />
      </div>
    </div>
  );
};

export default Index;
