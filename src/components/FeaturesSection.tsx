
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wand2, 
  Download, 
  Volume2, 
  BookOpen, 
  Users, 
  Zap, 
  Palette, 
  Globe,
  Clock,
  Shield
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Wand2,
      title: "IA Avancée",
      description: "Notre IA de dernière génération comprend vos intentions et crée des scénarios cohérents et captivants.",
      color: "text-script-primary"
    },
    {
      icon: Users,
      title: "Personnages Riches",
      description: "Créez jusqu'à 10+ personnages uniques avec des backgrounds détaillés et des arcs narratifs.",
      color: "text-script-secondary"
    },
    {
      icon: Download,
      title: "Export Professionnel",
      description: "Exportez vos scénarios en PDF formaté selon les standards de l'industrie cinématographique.",
      color: "text-script-accent"
    },
    {
      icon: Volume2,
      title: "Lecture Vocale",
      description: "Écoutez vos scénarios grâce à notre synthèse vocale naturelle et expressive.",
      color: "text-green-500"
    },
    {
      icon: BookOpen,
      title: "Création de BD",
      description: "Transformez automatiquement vos scénarios en planches de bande dessinée.",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      title: "Génération Rapide",
      description: "Créez des scénarios complets en moins de 30 secondes avec la génération prioritaire.",
      color: "text-yellow-500"
    },
    {
      icon: Palette,
      title: "Templates Variés",
      description: "Choisissez parmi des dizaines de templates pour différents genres et formats.",
      color: "text-pink-500"
    },
    {
      icon: Globe,
      title: "Multi-langues",
      description: "Générez des scénarios en français, anglais, espagnol et plus encore.",
      color: "text-blue-500"
    },
    {
      icon: Clock,
      title: "Historique Complet",
      description: "Retrouvez tous vos scénarios dans un historique organisé et recherchable.",
      color: "text-indigo-500"
    },
    {
      icon: Shield,
      title: "Sécurité Garantie",
      description: "Vos créations sont protégées et sauvegardées avec un chiffrement de niveau bancaire.",
      color: "text-red-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Fonctionnalités Avancées
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            ScriptGenius révolutionne la création de scénarios avec des outils puissants 
            et une intelligence artificielle de pointe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl text-slate-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-script text-white rounded-full font-medium">
            <Wand2 className="h-5 w-5 mr-2" />
            Et bien plus encore à découvrir...
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
