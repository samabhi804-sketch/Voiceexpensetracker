import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-microphone-alt text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-semibold text-text-dark">VoiceTracker</h1>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-emerald-600 text-white"
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-text-dark mb-6">
            Smart Expense Tracking
            <span className="block text-primary">with Your Voice</span>
          </h1>
          
          <p className="text-xl text-secondary mb-8 max-w-2xl mx-auto">
            Simply say "Spent 25 dollars on coffee this morning" and let VoiceTracker 
            automatically categorize and track your expenses. No typing required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-emerald-600 text-white px-8 py-3"
              data-testid="button-get-started"
            >
              <i className="fas fa-microphone mr-2"></i>
              Start Tracking Now
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="border border-gray-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-microphone-alt text-primary text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2" data-testid="text-voice-feature">Voice Input</h3>
                <p className="text-secondary">
                  Add expenses naturally by speaking. Our smart AI understands context and categorizes automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-pie text-blue-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2" data-testid="text-insights-feature">Smart Insights</h3>
                <p className="text-secondary">
                  Get detailed reports and visualizations to understand your spending patterns and habits.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-wallet text-accent text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2" data-testid="text-budget-feature">Budget Management</h3>
                <p className="text-secondary">
                  Set budgets per category and get alerts when you're approaching your limits.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
