import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2 } from "lucide-react"

export function BuildingInfoCard({
  buildingName,
  address,
}: {
  buildingName: string
  address: string
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-primary">{buildingName}</CardTitle>
        <p className="text-sm text-muted-foreground">{address}</p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with an authorised account to clock in.
        </p>
      </CardContent>
    </Card>
  )
}
