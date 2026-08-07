"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { CompanyProfile } from "@/lib/types";

export function CompanyEditor({ profile }: { profile: CompanyProfile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: (form: FormData) =>
      api<CompanyProfile>(`/companies/${profile.id}`, {
        method: "PATCH",
        // PATCH is partial by design: only what the form holds is sent, and
        // the server leaves everything else alone.
        body: JSON.stringify({
          name: form.get("name"),
          website: form.get("website") || null,
          description: form.get("description") || null,
          icp_description: form.get("icp_description") || null,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company details updated");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Edit
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit company details</DialogTitle>
          <DialogDescription>
            These feed every prompt the AI writes. Changing them changes what it claims.
          </DialogDescription>
        </DialogHeader>

        <form
          id="company-editor"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(new FormData(event.currentTarget));
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-name">Company name</Label>
            <Input id="edit-name" name="name" required defaultValue={profile.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">What does your company do?</Label>
            <Textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={profile.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-icp">Ideal customer</Label>
            <Textarea
              id="edit-icp"
              name="icp_description"
              rows={2}
              defaultValue={profile.icp_description ?? ""}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="company-editor" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
