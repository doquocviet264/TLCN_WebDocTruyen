import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const mockMembers = [
  { id: 1, name: 'Alice', role: 'Admin', avatar: 'https://github.com/shadcn.png' },
  { id: 2, name: 'Bob', role: 'Member', avatar: 'https://github.com/shadcn.png' },
  { id: 3, name: 'Charlie', role: 'Member', avatar: 'https://github.com/shadcn.png' },
  { id: 4, name: 'David', role: 'Moderator', avatar: 'https://github.com/shadcn.png' },
];

const GroupManagePage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Group Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://github.com/shadcn.png" alt="Group Avatar" />
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">Awesome Readers Club</h2>
              <p className="text-muted-foreground">Public Group - 4 Members</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input id="group-name" defaultValue="Awesome Readers Club" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Input id="group-description" defaultValue="A place for fans of great comics." />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="group-privacy">Private Group</Label>
            <Switch id="group-privacy" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">
                      Kick
                    </Button>
                    <Button variant="ghost" size="sm">
                      Ban
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center p-4 border border-destructive rounded-md">
            <div>
              <h3 className="font-semibold">Delete Group</h3>
              <p className="text-sm text-muted-foreground">Once you delete a group, there is no going back. Please be certain.</p>
            </div>
            <Button variant="destructive">Delete this Group</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupManagePage;
