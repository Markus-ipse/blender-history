var ctx = document.getElementById("myChart");

var myChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: window.labels,
    datasets: window.dataSets,
  },
  options: {
    tooltips: {
      mode: "index",
    },
    scales: {
      yAxes: [
        {
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  },
});
