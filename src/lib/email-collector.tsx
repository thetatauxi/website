"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { addEmailToSheet } from "@/lib/email";
import { useFormStatus } from "react-dom";

interface EmailCollectorProps {
  source: string;
  className?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Subscribing..." : "Subscribe"}
    </Button>
  );
}

export function EmailCollector({ source, className = "" }: EmailCollectorProps) {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [dialogStatus, setDialogStatus] = useState<"selecting" | "success" | "error">("selecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = [
    {
      id: "recruitment",
      label: "Recruitment Information & Events",
      description: "Get updates about rush events, recruitment deadlines, and chapter activities"
    },
    {
      id: "sponsor",
      label: "Partner with Us",
      description: "Learn about sponsorship opportunities and professional partnerships"
    },
    {
      id: "blog",
      label: "Blog Updates",
      description: "Stay informed about our latest blog posts and member stories"
    },
    {
      id: "general",
      label: "General Information",
      description: "Receive general updates about Theta Tau and our community"
    }
  ];

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get('email') as string;
    setTempEmail(emailValue);
    setDialogStatus("selecting");
    setShowCategoryDialog(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      if (isLoading) return; // Prevent closing while loading
      setShowCategoryDialog(false);
      setDialogStatus("selecting");
      if (dialogStatus === "success") {
        setEmail("");
        setCategories([]);
      }
    }
  }

  async function handleCategorySubmit() {
    if (isLoading) return;
    setIsLoading(true);

    if (categories.length === 0) {
      setCategories(["general"]); // Default to general if nothing selected
    }

    const formData = new FormData();
    formData.append('email', tempEmail);
    formData.append('source', source);
    formData.append('categories', categories.join(','));
    
    try {
      const result = await addEmailToSheet(formData);
      setDialogStatus("success");
      setErrorMessage(result.message);
    } catch (error) {
      setDialogStatus("error");
      setErrorMessage(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1"
            required
          />
          <SubmitButton />
        </div>
      </form>

      <Dialog open={showCategoryDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          {dialogStatus === "selecting" && (
            <>
              <DialogHeader>
                <DialogTitle>What interests you?</DialogTitle>
                <DialogDescription>
                  Select the types of updates you'd like to receive. Choose as many as you'd like.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {categoryOptions.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id={category.id}
                      checked={categories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        setCategories(prev => 
                          checked 
                            ? [...prev, category.id]
                            : prev.filter(id => id !== category.id)
                        );
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={category.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.label}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleCategorySubmit} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Subscribing...
                  </div>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </>
          )}
          
          {dialogStatus === "success" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-green-600">Subscription Successful!</DialogTitle>
                <DialogDescription className="text-center">
                  {errorMessage || "Thank you for subscribing. You'll receive updates based on your selected interests."}
                </DialogDescription>
              </DialogHeader>
              <Button 
                onClick={() => handleDialogClose(false)} 
                className="w-full mt-4"
              >
                Close
              </Button>
            </>
          )}

          {dialogStatus === "error" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-red-600">Subscription Failed</DialogTitle>
                <DialogDescription className="text-center">
                  {errorMessage}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogStatus("selecting")} 
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => handleDialogClose(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
