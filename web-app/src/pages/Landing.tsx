import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Cpu,
  Sparkles,
  Zap,
  Shield,
  Users,
  Code,
  Network,
  ArrowRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import TextType from "@/components/animated/Texttype";
import CountUp from "@/components/animated/CountUp";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.0, 0.0, 0.2, 1],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.0, 0.0, 0.2, 1],
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: [0.42, 0, 0.58, 1],
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.0, 0.0, 0.2, 1],
      },
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Driven Design",
      description:
        "Turn natural language requirements into structured architecture suggestions.",
    },
    {
      icon: Zap,
      title: "Fast Generation",
      description:
        "Receive architecture outputs in a few seconds with optimized AI inference.",
    },
    {
      icon: Shield,
      title: "Best Practices",
      description:
        "All generated architectures follow industry-standard patterns and conventions.",
    },
    {
      icon: Users,
      title: "Team Friendly",
      description:
        "Easily share and review design suggestions across your engineering teams.",
    },
    {
      icon: Code,
      title: "Tech-Aware",
      description:
        "Provides language- and framework-aware recommendations for common stacks.",
    },
    {
      icon: Network,
      title: "Cloud-Native Ready",
      description:
        "Outputs modern distributed designs including microservices and serverless options.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <motion.header
        className="border-b bg-white sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1] }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: [0, 0, 1, 1] }}
            >
              <Cpu className="h-6 w-6 text-blue-600" />
            </motion.div>
            <h1 className="font-bold text-xl">ArchiGen</h1>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-blue-600"
              >
                Features
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/design")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="py-24 px-4"
        style={{ y, opacity }}
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.0, 0.0, 0.2, 1] }}
          >
            <motion.div
              className="grid gap-8 md:grid-cols-2 items-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Left */}
              <motion.div className="z-10" variants={itemVariants}>
                <motion.div
                  className="inline-flex items-center gap-3 mb-4"
                  variants={itemVariants}
                >
                  <motion.span
                    className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: [0, 0, 1, 1],
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                    </motion.div>
                    AI-Powered
                  </motion.span>
                  <span className="text-sm text-gray-500">
                    Preview • Production-ready
                  </span>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-4"
                  variants={itemVariants}
                >
                  <motion.span
                    className="block mb-2 text-blue-700"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <TextType
                      text={["Design", "Analyze", "Improve"]}
                      typingSpeed={70}
                      pauseDuration={1300}
                      showCursor={true}
                      cursorCharacter="|"
                    />
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    Modern Software Architecture
                  </motion.span>
                </motion.h1>

                <motion.p
                  className="text-lg text-gray-700 max-w-xl mb-6"
                  variants={itemVariants}
                >
                  Translate high-level requirements into clean, consistent
                  architecture suggestions, diagrams and actionable design docs
                  — all powered by AI.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-8"
                  variants={containerVariants}
                >
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-md"
                      onClick={() => navigate("/design")}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Start Designing
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      variant="ghost"
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-3"
                      onClick={() =>
                        window.scrollTo({
                          top: window.innerHeight,
                          behavior: "smooth",
                        })
                      }
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="flex flex-wrap gap-3 items-center"
                  variants={containerVariants}
                >
                  <motion.div
                    className="flex items-center gap-4 bg-white border rounded-lg px-4 py-3 shadow-sm"
                    variants={statsVariants}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="text-blue-600 bg-blue-50 rounded-full p-2"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Cpu className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        <CountUp from={0} to={100} duration={1} />+
                      </div>
                      <div className="text-sm text-gray-500">Projects</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4 bg-white border rounded-lg px-4 py-3 shadow-sm"
                    variants={statsVariants}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="text-blue-600 bg-blue-50 rounded-full p-2"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Users className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        <CountUp from={0} to={80} duration={1} />+
                      </div>
                      <div className="text-sm text-gray-500">Active Teams</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4 bg-white border rounded-lg px-4 py-3 shadow-sm"
                    variants={statsVariants}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="text-blue-600 bg-blue-50 rounded-full p-2"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Zap className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        <CountUp from={0} to={250} duration={1} />+
                      </div>
                      <div className="text-sm text-gray-500">
                        Designs Generated
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right Preview Card */}
              <motion.div
                className="z-10 flex justify-center md:justify-end"
                variants={itemVariants}
              >
                <motion.div
                  className="w-full max-w-md rounded-xl border bg-white shadow-xl overflow-hidden"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <motion.div
                    className="px-5 py-4 bg-blue-600 text-white flex items-center justify-between"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <div>
                      <div className="text-sm opacity-90">Live Preview</div>
                      <div className="text-lg font-semibold">
                        Architecture Draft
                      </div>
                    </div>
                    <motion.div
                      className="text-sm opacity-80"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      v1.2
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  >
                    <motion.div
                      className="h-44 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                      >
                        <div className="font-medium text-gray-700 mb-2">
                          Microservice Diagram
                        </div>
                        <motion.div
                          className="text-xs"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Auto-generated by AI — SVG/PNG
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className="mt-4 grid grid-cols-2 gap-3"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                    >
                      <motion.div
                        className="text-sm text-gray-700"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="font-semibold text-gray-900">
                          3 Services
                        </div>
                        <div className="text-xs">API • Auth • Worker</div>
                      </motion.div>
                      <motion.div
                        className="text-sm text-gray-700"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="font-semibold text-gray-900">
                          Kubernetes
                        </div>
                        <div className="text-xs">Deployment + Helm</div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className="mt-4 flex gap-3"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                    >
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="sm"
                          className="w-full bg-white border hover:bg-gray-100 text-gray-800"
                        >
                          Export
                        </Button>
                      </motion.div>
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => navigate("/design")}
                        >
                          Open Designer
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-6 z-10 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              Trusted by engineering teams for reproducible designs
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Feature Section */}
      <motion.section
        ref={featuresRef}
        className="py-20 px-4 bg-gray-50 border-t"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Designed for Modern Engineering Teams
          </motion.h2>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((f, idx) => (
              <motion.div
                key={idx}
                variants={cardVariants}
                whileHover="hover"
                transition={{ duration: 0.3 }}
              >
                <Card className="border-gray-200 hover:shadow-md transition-all h-full">
                  <CardHeader>
                    <motion.div
                      className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <f.icon className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    <CardTitle>{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="py-20 px-4 text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-6"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Build Better Architectures Today
        </motion.h2>
        <motion.p
          className="text-gray-600 mb-8 max-w-xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Start generating clean and consistent software designs using AI.
        </motion.p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={() => navigate("/design")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4"
          >
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="border-t py-8 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        © 2025 ArchiGen — AI Software Architecture Workbench
      </motion.footer>
    </div>
  );
};

export default Landing;
