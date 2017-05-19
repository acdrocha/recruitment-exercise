import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { BookingService } from '../../services/booking.service';
import * as c3 from 'c3';
/**
 * Generated class for the Dashboard page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-dashboard',
  templateUrl: 'dashboard.html',
  providers: [BookingService]
})

export class Dashboard {
  @ViewChild('incomeChart') incomeChart: ElementRef;
  @ViewChild('occupancyChart') occupancyChart: ElementRef;

  totalIncome: number;
  fromMonth: number;
  toMonth: number;
  monthNames: string[];

  constructor(private bookingService: BookingService) {
    this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.fromMonth = 1;
    this.toMonth = (new Date()).getMonth() + 1;
  }


  ionViewDidLoad() {
    this.drawCharts();
  }


  drawCharts() {
    this.bookingService.getOccupancy(this.fromMonth, this.toMonth).subscribe(
      (occupancy: occupancyResponse) => {

        this.totalIncome = Object.keys(occupancy.total).reduce( function(acc, source) {
          var amount = occupancy.total[source].income || 0;
          return acc + amount;
        },0);

        this.drawIncomeChart(+this.fromMonth, +this.toMonth, occupancy);
        this.drawOccupancyChart(occupancy);

      },
      err =>{
        console.log('ERRROR:::', err);
      });
  }


  drawIncomeChart(fromMonth: number, toMonth: number, occupancy: any) {
    let incomeChartElement = this.incomeChart.nativeElement;
    let categories: string[] = [];
    let rows: string[][] = [occupancy.sources];

    for (var month = fromMonth; month <= toMonth; month++) {
      categories.push( this.getMonthName(month) );

      rows.push( occupancy.sources.map(function(source){
        let monthKey = month.toString().length === 1
          ? '0' + month
          : '' + month;

        let income = occupancy.month[monthKey] && occupancy.month[monthKey][source]
          ? occupancy.month[monthKey][source].income
          : 0;

        return income;
      }));
    }


    c3.generate({
        bindto: incomeChartElement,
        data: {
          type: 'area',
          rows: rows
        },
        axis: {
            x: {
                type: 'category',
                categories: categories
            }
        }
    });
  }


  drawOccupancyChart(occupancy) {
    let occupancyChartElement = this.occupancyChart.nativeElement;
    let columns = Object.keys(occupancy.total)
      .sort(this.moveBlockedToEnd)
      .map(function(source){
        var obj = occupancy.total[source];
        return [source, obj.nights];
    });

    c3.generate({
        bindto: occupancyChartElement,
        data: {
            type: 'donut',
            columns: columns
        },
        donut: {
            title: ""
        }
    });
  }


  private getMonthName(month: number) {
    return this.monthNames[month-1];
  }


  private moveBlockedToEnd(a, b) {
    if (a === 'Blocked') {
      return 1;
    }
    if ( b === 'Blocked') {
      return -1;
    }

    return 0;
  }

}


interface occupancyResponse {
  sources: string[],
  month: any,
  total: { [source: string]: sourceState },
}


interface sourceState {
  income: number,
  nights: number
}
