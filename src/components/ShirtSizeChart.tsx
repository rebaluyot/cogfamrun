import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const ShirtSizeChart = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">
          View Size Chart
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Shirt Size Chart</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border p-2">Size</th>
                  <th className="border p-2">Width (inches)</th>
                  <th className="border p-2">Length (inches)</th>
                  <th className="border p-2">Best Fits</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold">3XS</td>
                  <td className="border p-2">15"</td>
                  <td className="border p-2">23"</td>
                  <td className="border p-2">Kids (7-8 years)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">2XS</td>
                  <td className="border p-2">16"</td>
                  <td className="border p-2">24"</td>
                  <td className="border p-2">Kids (9-10 years)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">XS</td>
                  <td className="border p-2">17"</td>
                  <td className="border p-2">25"</td>
                  <td className="border p-2">Kids (11-12 years)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">S</td>
                  <td className="border p-2">18"</td>
                  <td className="border p-2">26"</td>
                  <td className="border p-2">Adult (Small Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">M</td>
                  <td className="border p-2">19"</td>
                  <td className="border p-2">27"</td>
                  <td className="border p-2">Adult (Medium Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">L</td>
                  <td className="border p-2">20"</td>
                  <td className="border p-2">28"</td>
                  <td className="border p-2">Adult (Large Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">XL</td>
                  <td className="border p-2">21"</td>
                  <td className="border p-2">29"</td>
                  <td className="border p-2">Adult (XL Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">2XL</td>
                  <td className="border p-2">22"</td>
                  <td className="border p-2">30"</td>
                  <td className="border p-2">Adult (2XL Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">3XL</td>
                  <td className="border p-2">23"</td>
                  <td className="border p-2">31"</td>
                  <td className="border p-2">Adult (3XL Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">4XL</td>
                  <td className="border p-2">25"</td>
                  <td className="border p-2">33"</td>
                  <td className="border p-2">Adult (4XL Frame)</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">5XL</td>
                  <td className="border p-2">26"</td>
                  <td className="border p-2">34"</td>
                  <td className="border p-2">Adult (5XL Frame)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>* Measurements are approximate and may vary slightly</p>
            <p>* Width is measured across the chest, one inch below armhole</p>
            <p>* Length is measured from highest point of shoulder to bottom hem</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
